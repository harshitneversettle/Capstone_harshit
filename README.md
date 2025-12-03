
# SolEase – Simplifying lending and borrowing on Solana.

A secure, transparent, and user-friendly decentralized finance (DeFi) protocol built on the Solana blockchain for seamless lending and borrowing of digital assets.

---

## Project Documentation & Diagrams

The following documents and diagrams were **created specifically for this project** to support its design, planning, and implementation:

* SRS Document :
  [https://drive.google.com/file/d/1xaPzXe70YgVkHRmb8qAa3M_LEVi3Chnu/view?usp=sharing](https://drive.google.com/file/d/1xaPzXe70YgVkHRmb8qAa3M_LEVi3Chnu/view?usp=sharing)
* Diagrams & Architecture :[https://excalidraw.com/#json=v0vRE3XmlTIUKHpM3PTWY,B6AK6g6iPVOS5lKNkk4FFQ](https://excalidraw.com/#json=v0vRE3XmlTIUKHpM3PTWY,B6AK6g6iPVOS5lKNkk4FFQ)

---

## Overview
The decentralized lend-and-borrow protocol lets users supply liquidity to earn interest or borrow assets against collateral without traditional intermediaries. It is built on Solana with the Anchor framework, keeping all lending, borrowing, and accounting logic on-chain. Users interact by calling program instructions (via CLI or clients) to initialize the treasury, deposit liquidity, open a loan, repay, and withdraw funds. A utilization-aware rate model is used: below 80% treasury utilization the interest rate is 5%, and at or above 80% it jumps to 25%, incentivizing timely repayment and protecting the pool.

---


## Instructions 
<details>
<summary>Initialize Treasury</summary>
  
This instruction initializes the main treasury PDA that acts as the shared liquidity pool for the protocol. Liquidity providers deposit into this treasury, and the pooled funds are used to issue loans to borrowers. The treasury state tracks values such as total liquidity and total borrowed amount, and is referenced by subsequent instructions for borrowing, repayment, and liquidity withdrawal.

<img width="1093" height="206" alt="image" src="https://github.com/user-attachments/assets/8e391121-a9b9-4b20-9190-620a28cdca91" />


</details>

<details>
<summary>User Treasury</summary>
Liquidity providers deposit funds into the main treasury, and a per-user PDA is derived with seeds like user_pubkey + "treasury". This PDA acts as the user’s liquidity record, storing details such as the token mint, deposited amount, deposit timestamp, and the treasury ATA where funds are held. The structure enforces a single, unique record per user and treasury, enabling organized tracking and preventing duplicate entries. It provides a secure, transparent view of each user’s contribution to the shared liquidity pool.

  
<img width="1036" height="360" alt="image" src="https://github.com/user-attachments/assets/4b6bbd0b-8692-43f2-9a70-d4cb37933c6d" />


</details>


<details>
<summary>Initialize pool</summary>

  
This instruction initializes a per-user loan pool PDA that stores all core details for a borrower’s position. It identifies the borrower, derives a unique pool address from the user’s public key, and guarantees only one pool per user. The pool records the collateral mint, borrow mint, deposited collateral amount, and the maximum borrowable amount computed from that collateral. It also stores the vault ATA where collateral is locked and the bump needed to safely re-derive the PDA. This setup forms the foundation for later actions like borrowing, repayment, and potential liquidation.

<img width="1136" height="428" alt="image" src="https://github.com/user-attachments/assets/df7e0768-8ded-4f09-bf52-735eb404e60f" />

</details>


<details>
<summary>Deposit collateral</summary>
This instruction is called when a borrower deposits collateral into the loan vault. It validates that the correct pool, mint, and token accounts are provided, then transfers tokens from the user’s token account to the pool’s vault token account. The transfer is authorized by the user and executed via a CPI to the token program, so the program never directly holds user keys or funds. After a successful transfer, the pool’s collateral_amount field is updated and the tokens remain locked in the vault as collateral backing the loan.

<img width="1140" height="374" alt="image" src="https://github.com/user-attachments/assets/bafc9486-d718-4b37-9ee8-bb4d572ccbae" />

</details>

<details>
<summary>Borrow loan</summary>
This instruction is invoked after collateral has been deposited and determines the borrower’s loan amount based on the recorded collateral and risk parameters. It then transfers tokens from the treasury’s token account to the borrower’s token account, authorized by the treasury PDA so only the program can move treasury funds. The transfer is executed via a CPI to the token program, keeping the flow secure and fully on-chain. Afterward, the treasury state reduces available liquidity, increases total borrowed, and the pool state is updated to reflect the new active loan.


<img width="1174" height="350" alt="image" src="https://github.com/user-attachments/assets/9a859393-95c8-4f1b-a8bf-d8ebc14855bb" />

</details>

<details>
<summary>Repay loan</summary>
This instruction settles a borrower’s debt and releases collateral. It computes simple interest from principal, rate, and elapsed time, then transfers the repay amount from the user’s token account to the treasury via a CPI authorized by the user. After a successful transfer, the pool state clears loan-specific fields (loan_amount, borrow_amount, borrow_time) and the treasury increases total_liquidity by principal + interest while reducing total_borrowed by the principal. This keeps accounting accurate and unlocks the borrower’s collateral for withdrawal.

<img width="1495" height="437" alt="image" src="https://github.com/user-attachments/assets/7b2e7a93-0eb9-44b4-9fbb-59d51ba4168f" />


</details>


<details>
<summary>LP State initialization</summary>
The LP state initialization instruction creates a dedicated LiquidatorState PDA for each liquidity provider, using the provider’s wallet address as a seed. It also initializes the provider’s associated token account for the chosen liquidity mint and stores references to this ATA, the mint, and the relevant treasury authority bump. All numeric fields, such as deposited amount, current liquidity, and timestamps, are set to zero so the protocol starts from a clean slate. This gives the program a single, canonical record for tracking each LP’s future deposits and withdrawals

<img width="1001" height="309" alt="image" src="https://github.com/user-attachments/assets/7b605bf6-f03b-4c81-964a-eca6297283bf" />

  
</details>

</details>


<details>
<summary>Liquidity Withdraw</summary>
This instruction lets a liquidity provider withdraw part or all of a previously deposited position from the pool. It verifies the provider’s position record, checks that the requested amount is available, and then reduces that position by the specified amount. The program computes the provider’s share of treasury funds and transfers the corresponding tokens from the treasury account back to the recipient account. Finally, it updates treasury and pool state to reflect the reduced liquidity and keep accounting consistent.
  
<img width="1454" height="193" alt="image" src="https://github.com/user-attachments/assets/86d2b43a-beeb-4e1f-8299-e3b42df09bc5" />

</details>



## Key Features

* Trustless lending and borrowing
* Collateral-backed loan mechanism
* Simple interest calculation (current implementation)
* Secure PDA-based account architecture
* Real-time wallet connectivity
* Modular and scalable design

---

## Interest and Risk Model

SolEase maintains a shared treasury that funds all loans. The protocol tracks treasury utilization to adjust interest rates dynamically:

- When utilization is below 80% of total funds, loans use a **base interest rate of 5%**. (as of now)
- When utilization reaches or exceeds **80%**, the interest rate for new or updated loans jumps to **25%**. (as of now)

This jump in interest rate makes borrowing significantly more expensive when the treasury is stressed, encouraging borrowers to repay and helping refill the treasury. The current implementation uses simple interest based on principal, rate, and time elapsed; the design can later be extended to more advanced curves.

## System Architecture

### On-Chain Program

Developed using Rust and the Anchor framework, the on-chain program manages all critical protocol logic, including:

* Treasury initialization and configuration
* Liquidity deposits and withdrawals
* Borrowing and loan lifecycle management
* Interest computation (simple model for now)
* Repayment and liquidation handling

Program Derived Addresses (PDAs) are used to guarantee secure and deterministic state management across the protocol.

### Off-Chain Interface

The current version is operated via CLI and program clients (Anchor tests or custom scripts). A future React + TypeScript frontend is planned to wrap these instructions in a user-friendly interface using:

- `@solana/web3.js`
- Anchor client libraries
- Solana Wallet Adapter

This UI will allow users to connect wallets such as Phantom, Solflare, and Backpack and interact with the protocol without writing code.


---

## User Roles

| Role               | Responsibility                         |
| ------------------ | -------------------------------------- |
| Liquidity Provider | Supplies tokens and earns interest     |
| Borrower           | Provides collateral to borrow assets   |
| Protocol Admin     | Manages treasury and system parameters |
| Liquidator         | Handles liquidation of risky positions |
| Auditor            | Reviews protocol operations and logic  |

---

## Technology Stack

* Blockchain: Solana (Devnet and Mainnet)
* Smart Contracts: Rust + Anchor
* Frontend: Future scope    
* Wallets: Phantom, Solflare, Backpack
* Oracles: Pyth / Switchboard (Optional)
* Development Tools: Solana CLI, Anchor CLI, GitHub Actions

---

## Installation and Setup

### Prerequisites

* Node.js
* Solana CLI
* Anchor Framework
* Solana-compatible wallet (Phantom recommended)

### Steps

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Build the Solana program
anchor build

# Deploy to Devnet
anchor deploy

# Run the frontend application
npm start
```

---

## Usage Flow (Program Level)

1. Initialize the global treasury and configuration accounts.
2. For liquidity providers:
   - Initialize LP state.
   - Deposit liquidity into the treasury.
   - Optionally withdraw liquidity later.
3. For borrowers:
   - Initialize a loan pool (per-user PDA).
   - Deposit collateral into the vault.
   - Borrow against collateral, subject to LTV and utilization-based interest.
   - Repay principal + interest.
   - Withdraw collateral once the loan is cleared.


---

## Security Measures

* PDA and signer validation
* Ownership and access verification
* Rent-exempt account enforcement
* Oracle-based price validation
* SPL Token standard compliance

---

## Future Enhancements

- Implementation of compound interest and more advanced utilization-based rate curves
- Time- and health-based automated collateral liquidation
- DAO-based governance for updating risk parameters and treasury configuration
- Real-time analytics dashboard and explorer for protocol state
- Automated liquidation bots and keepers


---

## Version

Current Version: 1.0

---

## Author

Harshit Yadav

---

## License

This project is developed strictly for academic and research purposes under institutional guidelines.

---

For issues, suggestions, or contributions, feel free to open an issue or submit a pull request. Your feedback is always welcome.

