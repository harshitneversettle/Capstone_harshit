use anchor_lang::prelude::* ;

#[derive[Accounts]]
#[derive[InitSpace]] 


pub struct PoolState{
    pub owner : Pubkey ,
    pub collateral_amount : u64 ,
    pub loan_amount : u64 ,
    pub vault_pda : Pubkey ,    // to store collateral 
    pub collateral_mint : Pubkey ,
    bump : u8  ,
}