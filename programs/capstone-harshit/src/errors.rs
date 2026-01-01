use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Invalid price feed")]
    InvalidPrice,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
    #[msg("Invalid mint")]
    InvalidMint,
    #[msg("Account not initialized")]
    NotInitialized,
}
