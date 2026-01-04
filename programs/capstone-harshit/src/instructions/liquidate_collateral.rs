use anchor_lang::prelude::*;
use anchor_lang::solana_program::native_token::LAMPORTS_PER_SOL;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer, accessor::amount};
use anchor_spl::associated_token::AssociatedToken;
use crate::states::{PoolState, TreasuryState, pool_state, treasury_state};
use pyth_solana_receiver_sdk::price_update::{PriceUpdateV2};
use pyth_solana_receiver_sdk::price_update::get_feed_id_from_hex;
use pyth_sdk_solana::load_price_feed_from_account_info;
use crate::errors::ErrorCode ;




#[derive(Accounts)] 
pub struct LiquidateCollateral<'info>{

    #[account(mut)]
    pub liquidator : Signer<'info> ,

    #[account(
        mut , 
        constraint = liquidator_collateral_mint_ata.mint == collateral_mint.key() 
    )]
    pub liquidator_collateral_mint_ata : Account<'info , TokenAccount> ,

    #[account(
        mut , 
        constraint = liquidator_loan_mint_ata.mint == liquidity_mint.key() 
    )]
    pub liquidator_loan_mint_ata : Account<'info , TokenAccount> ,

    /// CHECK: owner is only for derivation of pda 
    #[account(mut)]
    pub owner : UncheckedAccount<'info> ,

    #[account(mut,constraint = vault_ata.mint == collateral_mint.key())]
    pub vault_ata : Account<'info , TokenAccount>  ,

    #[account(
        mut,
        constraint = pool_state.collateral_amount > 0 @ ErrorCode::NotInitialized
    )]
    pub pool_state : Account<'info , PoolState> ,

    #[account(
        mut ,
        seeds = [b"treasury-authority"],
        bump 
    )] 
    /// CHECK: PDA authority, no data stored
    pub treasury_authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub treasury_state: Account<'info, TreasuryState>,

    #[account(mut, token::mint = liquidity_mint, token::authority = treasury_authority)]
    pub treasury_ata: Account<'info, TokenAccount>,      

    #[account(
        mut ,
        seeds = [b"vault-authority", owner.key().as_ref()],
        bump = pool_state.vault_authority_bump 
    )]
    /// CHECK: PDA authority, no data stored
    pub vault_authority: UncheckedAccount<'info>,

    pub liquidity_mint: Account<'info, Mint>, 
    pub collateral_mint: Account<'info, Mint>,
    
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx : Context<LiquidateCollateral>)->Result<()>{
    // transfer wsol from liquidator_loan_mint_ata --> treasury_ata 
    // transfer usdc from vault_ata --> liquidator_collateral_ata 
    // update the pool , treasury , and close the loan , pool.is_active = false 

    let owner = ctx.accounts.owner.key() ;
    let pool = &mut ctx.accounts.pool_state ;
    let bump = pool.vault_authority_bump ;
    let treasury = &mut ctx.accounts.treasury_state ;
    let vault_ata = &ctx.accounts.vault_ata ;
    let loan_amount = pool.loan_amount as u128 ; // in raw units 
    let interest_rate = pool.interest_rate ;
    let interest_num = loan_amount.checked_mul(interest_rate as u128).ok_or(ErrorCode::MathOverflow)?;
    let interest = interest_num.checked_div(10000).ok_or(ErrorCode::MathOverflow)?;  // cps interest is in basis points 
    let amount_to_liquify = loan_amount.checked_add(interest).ok_or(ErrorCode::MathOverflow)?;

    let transfer_accounts = Transfer{
        from : ctx.accounts.liquidator_loan_mint_ata.to_account_info() ,
        to : ctx.accounts.treasury_ata.to_account_info() ,
        authority : ctx.accounts.liquidator.to_account_info()
    } ;
    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), transfer_accounts) ;
    token::transfer(cpi_ctx, amount_to_liquify as u64)?;

    let vault_ata = pool.vault_ata ;
    let vault_auth = &ctx.accounts.vault_authority ;
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"vault-authority",
        owner.as_ref(),
        &[bump],
    ]];

    let transfer_accounts2 = Transfer{
        from : ctx.accounts.vault_ata.to_account_info() ,
        to : ctx.accounts.liquidator_collateral_mint_ata.to_account_info() ,
        authority : ctx.accounts.vault_authority.to_account_info() 
    } ;
    let seize_amount = compute_colllateral_seize(&ctx)?;

    let cpi_ctx2 = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), transfer_accounts2, signer_seeds);
    token::transfer(cpi_ctx2, seize_amount)?;

    Ok(())
}

fn compute_colllateral_seize(ctx: &Context<LiquidateCollateral>)->Result<u64>{
    let pool_state = &ctx.accounts.pool_state;
    let loan_amount = pool_state.loan_amount as u128; 
    let liquidity_price = 100_000_000u128;         
    let bonus_bps = 500u128;             // in bps

    let bonus = (10_000u128 + bonus_bps).checked_div(10_000u128).ok_or(ErrorCode::MathOverflow)?;
    let seize_amount = loan_amount
            .checked_mul(liquidity_price).ok_or(ErrorCode::MathOverflow)?
            .checked_mul(bonus).ok_or(ErrorCode::MathOverflow)?
            .checked_div(1_000_000_000u128).ok_or(ErrorCode::MathOverflow)?;    
    Ok(seize_amount as u64)
}