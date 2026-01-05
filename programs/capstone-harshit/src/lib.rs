use anchor_lang::prelude::*;

declare_id!("5tZLdZE1a3dWeNTXZrQEv3pvk4FavLwV2jAd2GmVqHFC");

pub mod instructions;
pub mod states;
pub mod errors;

use instructions::*;
use errors::* ;

#[program]
pub mod capstone_harshit {
    use anchor_lang::context;

    use super::*;

    pub fn initialize_liquidator_state(ctx: Context<InitializeLpState>) -> Result<()> {
        instructions::initialize_lp_state::handler(ctx)
    }  

    pub fn initialize_treasury(ctx: Context<InitializeTreasury>) -> Result<()> {
        instructions::initialize_treasury::handler(ctx)
    }  

    pub fn deposit_treasury(ctx: Context<UserDeposit>, amount: u64) -> Result<()> {
        instructions::user_treasury::handler(ctx, amount)
    }

    pub fn initialize_pool(ctx: Context<InitializePool>) -> Result<()> {
        instructions::initialize_pool::handler(ctx)
    }

    pub fn deposit_collateral(ctx: Context<DepositCollateral>, amount: u64) -> Result<()> {
        instructions::deposit_collateral::handler(ctx, amount)
    }

    pub fn borrow_loan(ctx : Context<BorrowLoan>)->Result<()>{
        instructions::borrow_loan::handler(ctx)
    }

    pub fn repay_loan(ctx : Context<RepayLoan>)->Result<()>{
        instructions::repay_loan::handler(ctx)
    }

    pub fn liquidity_withdraw(ctx : Context<LiquidityWithdraw> , amount_deposited : u64 )->Result<()>{
        instructions::liquidity_withdraw::handler(ctx , amount_deposited)
    }

    pub fn liquidate_collateral(ctx : Context<LiquidateCollateral> )->Result<()>{
        instructions::liquidate_collateral::handler(ctx) 
    }

    
}

