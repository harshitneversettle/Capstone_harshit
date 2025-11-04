use anchor_lang::prelude::*;
use crate::states::*;

pub struct InitializePool<'info> {
    #[account(
        init ,
        payer = owner , 
        space = 8 + PoolState::INIT_SPACE ,
        seeds = [b"Pool" , owner.key().as_ref()] ,
        bump ,
    )]

    pub pool_state : Account<'info , PoolState> ,

    #[account(
        init ,
        payer = owner ,
        space = 8 + VaultState::INIT_SPACE ,
        seeds = [b"Vault" , owner.key().as_ref()] ,
        bump ,
    )]
    pub vault_state : Account<'info , VaultState > ,

    pub owner : Signer<'info> ,

    pub collateral_mint : Interface<'info,Mint> ,

    pub system_program : Program<'info, System> ,

}

pub fn initialize_pool(&self , collateral_amount : u64 )->Result<()> {
    let pool = &mut ctx.accounts.pool_state ;
    let vault = &mut ctx.accounts.vault_state ;

    pool.owner = ctx.accounts.owner.key();
    pool.collateral_mint = ctx.accounts.collateral_mint.key();
    pool.vault_pda = ctx.accounts.vault_pda.key();
    pool.bump = ctx.bumps.pool_state;

    vault.pool = pool.key();
    vault.bump = ctx.bumps.vault_pda;

    msg!("✅ Pool + Vault created!");
    Ok(())
}
