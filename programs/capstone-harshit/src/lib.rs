use anchor_lang::prelude::*;

pub mod states;
pub mod instructions;

use instructions::*;
declare_id!("AKrXLPmj1tW9AzG8EhkmQ7zt2t8FFTVXxsWGjgzrWifg");

#[program]
pub mod capstone_harshit {
    use super::*;

    pub fn initialize_pool(ctx: Context<InitializePool>) -> Result<()> {
        initialize_pool(ctx)
    }
}

#[derive(Accounts)]
pub struct Initialize {}
