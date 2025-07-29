# Solana Token Sniper Bot - Complete Setup Guide

This guide will walk you through setting up the Solana Token Sniper Bot from scratch.

## 📋 Prerequisites

Before starting, ensure you have:
- A computer running Windows, macOS, or Linux
- Internet connection
- Basic understanding of cryptocurrency and Solana
- **Funds you can afford to lose completely**

## 🔧 Step 1: Install Required Software

### 1.1 Install Node.js
1. Go to [nodejs.org](https://nodejs.org/)
2. Download the LTS version (18.x or higher)
3. Run the installer and follow the prompts
4. Verify installation:
```bash
node --version
npm --version
```

### 1.2 Install Git (Optional)
1. Go to [git-scm.com](https://git-scm.com/)
2. Download and install Git
3. Verify installation:
```bash
git --version
```

## 🏗️ Step 2: Download and Setup Bot

### 2.1 Download the Bot
```bash
# Option 1: Clone with Git
git clone <repository-url>
cd solana-token-sniper

# Option 2: Download ZIP file and extract
```

### 2.2 Install Dependencies
```bash
npm install
```

This will install all required packages including Solana libraries, web framework, and utilities.

## 🔑 Step 3: Wallet Setup

### 3.1 Create or Import Solana Wallet

**Option A: Create New Wallet**
```bash
# Install Solana CLI (optional but recommended)
npm install -g @solana/cli

# Generate new keypair
solana-keygen new --outfile ./wallet.json
```

**Option B: Use Existing Wallet**
- Export private key from Phantom/Solflare wallet
- Or use existing keypair file

### 3.2 Get Private Key in Base58 Format
```bash
# If using Solana CLI
solana-keygen pubkey ./wallet.json --outfile ./pubkey.txt
# Private key will be in the wallet.json file

# Convert to base58 if needed (most wallets export in this format)
```

### 3.3 Fund Your Wallet
1. Send SOL to your wallet address
2. **Start with small amounts for testing (0.1-0.5 SOL)**
3. Verify balance:
```bash
solana balance <your-wallet-address>
```

## 🌐 Step 4: RPC Endpoint Setup

### 4.1 Choose RPC Provider

**Free Options:**
- Solana public RPC: `https://api.mainnet-beta.solana.com`
- Limited rate limits and reliability

**Paid Options (Recommended for production):**
- **QuickNode**: [quicknode.com](https://quicknode.com)
- **Helius**: [helius.xyz](https://helius.xyz)
- **Alchemy**: [alchemy.com](https://alchemy.com)

### 4.2 Get RPC URLs
1. Sign up for chosen provider
2. Create new Solana mainnet endpoint
3. Copy HTTP and WebSocket URLs

## 📱 Step 5: Telegram Setup (Optional but Recommended)

### 5.1 Create Telegram Bot
1. Open Telegram and message @BotFather
2. Send `/newbot` command
3. Follow prompts to name your bot
4. Save the bot token (looks like: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

### 5.2 Get Chat ID
1. Message your bot once
2. Visit: `https://api.telegram.org/bot<YourBOTToken>/getUpdates`
3. Find your chat ID in the response
4. Or use @userinfobot to get your chat ID

## ⚙️ Step 6: Configuration

### 6.1 Create Environment File
```bash
cp .env.example .env
```

### 6.2 Edit Configuration
Open `.env` file and update:

```env
# REQUIRED: Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_WSS_URL=wss://api.mainnet-beta.solana.com
PRIVATE_KEY=your_base58_private_key_here

# REQUIRED: Bot Settings
MAX_BUY_AMOUNT_SOL=0.05          # Start small!
MIN_LIQUIDITY_SOL=2.0
MAX_SLIPPAGE_PERCENT=15
PRIORITY_FEE_LAMPORTS=50000

# Security Filters (Recommended)
MAX_BUY_TAX_PERCENT=10
MAX_SELL_TAX_PERCENT=15
REQUIRE_LIQUIDITY_LOCK=true
MIN_HOLDER_COUNT=5

# Profit Management
TAKE_PROFIT_PERCENT=50           # Take profit at 50%
STOP_LOSS_PERCENT=30             # Stop loss at -30%
AUTO_SELL_ENABLED=true

# Telegram (Optional)
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
ENABLE_TELEGRAM=true

# Web Interface
ENABLE_WEB_UI=true
WEB_PORT=3000
```

### 6.3 Important Configuration Notes

**Start Conservative:**
- `MAX_BUY_AMOUNT_SOL=0.05` (only $2-3 per snipe)
- `MIN_LIQUIDITY_SOL=2.0` (avoid low liquidity tokens)
- `MAX_SLIPPAGE_PERCENT=15` (account for volatile tokens)

**Security First:**
- `REQUIRE_LIQUIDITY_LOCK=true` (avoid rug pulls)
- `MAX_BUY_TAX_PERCENT=10` (avoid high tax tokens)
- Keep stop loss reasonable (`STOP_LOSS_PERCENT=30`)

## 🧪 Step 7: Testing

### 7.1 Test Configuration
```bash
npm run build
npm run dev test
```

This will verify:
- RPC connection works
- Wallet is accessible
- Balance is sufficient
- Telegram notifications work (if enabled)

### 7.2 Check Status
```bash
npm run dev status
```

Should show:
- Wallet balance
- Connection status
- Current configuration

## 🚀 Step 8: Running the Bot

### 8.1 Start with Web Interface
```bash
npm run dev start --web
```

1. Bot will start monitoring
2. Web interface available at `http://localhost:3000`
3. Monitor activity in real-time

### 8.2 CLI Mode
```bash
npm run dev start
```

Interactive command line interface with real-time updates.

### 8.3 Production Mode
```bash
npm run build
npm start
```

## 📊 Step 9: Monitoring and Management

### 9.1 Web Dashboard
Visit `http://localhost:3000` to:
- View real-time snipe attempts
- Monitor active positions
- Track profit/loss
- Receive notifications

### 9.2 Telegram Alerts
If configured, you'll receive:
- Successful snipe notifications
- Failed attempt alerts
- Profit/loss updates
- System status messages

### 9.3 Log Files
Check `./logs/` directory for:
- `combined.log` - All bot activity
- `error.log` - Error messages only

## ⚠️ Step 10: Safety Guidelines

### 10.1 Start Small
- Use minimal amounts for first week
- Test with different token types
- Monitor success/failure rates
- Gradually increase if profitable

### 10.2 Risk Management
- Never risk more than 1-2% of portfolio per snipe
- Set strict daily loss limits
- Take profits regularly
- Monitor gas fees vs profits

### 10.3 Regular Maintenance
- Update RPC endpoints if needed
- Monitor wallet balance
- Review and adjust parameters
- Keep bot software updated

## 🛠️ Troubleshooting

### Common Issues

**Connection Errors:**
```bash
# Test RPC connection
curl -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1, "method":"getHealth"}' YOUR_RPC_URL
```

**Wallet Issues:**
```bash
# Verify wallet format
npm run dev config
```

**Transaction Failures:**
- Increase priority fee
- Reduce slippage tolerance
- Check wallet balance
- Monitor network congestion

### Performance Issues
- Use paid RPC endpoint
- Optimize internet connection
- Close unnecessary applications
- Monitor system resources

## 📈 Advanced Configuration

### 10.1 Premium RPC Setup
For better performance, use premium RPC:

```env
# QuickNode example
SOLANA_RPC_URL=https://your-endpoint.solana-mainnet.quiknode.pro/your-key/
SOLANA_WSS_URL=wss://your-endpoint.solana-mainnet.quiknode.pro/your-key/
```

### 10.2 Multiple DEX Support
Bot monitors:
- Raydium AMM pools
- Orca whirlpools
- Jupiter aggregated routes

### 10.3 Advanced Filters
```env
# Creator filtering
BLACKLISTED_CREATORS=pubkey1,pubkey2,pubkey3
WHITELISTED_CREATORS=trusted_pubkey1,trusted_pubkey2

# Timing controls
SNIPE_DELAY_MS=2000              # Wait 2 seconds after detection
MAX_CONCURRENT_SNIPES=3          # Limit simultaneous snipes
```

## 🎯 Success Tips

1. **Start Conservative**: Use small amounts and conservative settings
2. **Monitor Actively**: Watch first few hours/days closely
3. **Adjust Parameters**: Fine-tune based on results
4. **Take Profits**: Don't get greedy, secure gains regularly
5. **Learn Continuously**: Study successful vs failed snipes
6. **Stay Updated**: Follow Solana ecosystem developments

## 📞 Getting Help

If you encounter issues:
1. Check troubleshooting section
2. Review log files for errors
3. Test with minimal configuration
4. Verify all prerequisites are met
5. Join community discussions

Remember: This is high-risk trading. Only use funds you can afford to lose completely!