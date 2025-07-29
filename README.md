# Solana Token Sniper Bot

A production-ready Solana token sniper bot with advanced anti-scam protection and real-time monitoring capabilities.

## ⚠️ IMPORTANT DISCLAIMERS

**FINANCIAL RISK WARNING**: This software involves high-risk cryptocurrency trading. You may lose all invested funds. Only use money you can afford to lose completely.

**LEGAL COMPLIANCE**: Ensure compliance with your local laws and regulations before using this bot. Some jurisdictions may restrict automated trading.

**NO WARRANTIES**: This software is provided "as is" without any warranties. The developers are not responsible for any financial losses.

## 🚀 Features

### Core Functionality
- **Automated Token Detection**: Monitors Solana blockchain for newly launched tokens
- **Real-time Security Analysis**: Comprehensive scam detection and risk assessment
- **Instant Purchase Execution**: High-speed transaction processing with minimal latency
- **Multi-DEX Support**: Compatible with Raydium, Orca, and Jupiter aggregator

### Anti-Scam Protection
- ✅ Liquidity lock verification
- ✅ Buy/sell tax analysis
- ✅ Holder distribution analysis
- ✅ Mint authority detection
- ✅ Freeze authority detection
- ✅ Creator reputation checking
- ✅ Anti-bot mechanism detection

### Advanced Features
- 📊 Real-time web dashboard
- 📱 Telegram notifications
- 💰 Automated profit taking and stop loss
- 📈 Position tracking and P&L monitoring
- 🎯 Configurable sniping parameters
- 🔄 Queue management for concurrent snipes

## 📋 Prerequisites

- Node.js 18+ and npm
- Solana wallet with SOL for trading
- RPC endpoint (free or paid)
- Telegram bot (optional, but recommended)

## 🛠️ Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd solana-token-sniper
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment**:
```bash
cp .env.example .env
```

4. **Edit `.env` file with your configuration**:
```env
# Required settings
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
PRIVATE_KEY=your_base58_private_key_here

# Sniping parameters
MAX_BUY_AMOUNT_SOL=0.1
MIN_LIQUIDITY_SOL=5.0
MAX_SLIPPAGE_PERCENT=10

# Security filters
MAX_BUY_TAX_PERCENT=5
MAX_SELL_TAX_PERCENT=10
REQUIRE_LIQUIDITY_LOCK=true

# Telegram notifications (optional)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
ENABLE_TELEGRAM=true
```

5. **Build the project**:
```bash
npm run build
```

## 🎮 Usage

### Command Line Interface

**Start the bot with web interface**:
```bash
npm run dev start --web
```

**Check bot status**:
```bash
npm run dev status
```

**Test configuration**:
```bash
npm run dev test
```

**View configuration**:
```bash
npm run dev config
```

### Web Interface

Access the dashboard at `http://localhost:3000` (default) to:
- Monitor real-time sniping activity
- View active positions and P&L
- Track success rates and statistics
- Configure bot parameters

### Interactive Mode

Run the bot in interactive mode:
```bash
npm run dev start
```

Available commands:
- `help` - Show available commands
- `status` - Display current status
- `start/stop` - Control monitoring
- `balance` - Check wallet balance
- `positions` - View active positions

## ⚙️ Configuration

### Key Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `MAX_BUY_AMOUNT_SOL` | Maximum SOL to spend per snipe | 0.1 |
| `MIN_LIQUIDITY_SOL` | Minimum required liquidity | 5.0 |
| `MAX_SLIPPAGE_PERCENT` | Maximum acceptable slippage | 10% |
| `SNIPE_DELAY_MS` | Delay before sniping | 1000ms |
| `PRIORITY_FEE_LAMPORTS` | Transaction priority fee | 100000 |

### Security Filters

| Filter | Description | Default |
|--------|-------------|---------|
| `MAX_BUY_TAX_PERCENT` | Skip tokens with high buy tax | 5% |
| `MAX_SELL_TAX_PERCENT` | Skip tokens with high sell tax | 10% |
| `REQUIRE_LIQUIDITY_LOCK` | Require locked liquidity | true |
| `MIN_HOLDER_COUNT` | Minimum number of holders | 10 |
| `MAX_TOP_HOLDER_PERCENT` | Maximum top holder percentage | 30% |

### Profit Management

| Setting | Description | Default |
|---------|-------------|---------|
| `TAKE_PROFIT_PERCENT` | Auto-sell at profit % | 100% |
| `STOP_LOSS_PERCENT` | Auto-sell at loss % | 50% |
| `AUTO_SELL_ENABLED` | Enable automatic selling | true |

## 🔧 Development

### Project Structure

```
src/
├── config/          # Configuration management
├── services/        # Core services (sniper, monitor, security)
├── types/          # TypeScript type definitions
├── utils/          # Utility functions and logging
├── web/            # Web interface
├── cli/            # Command line interface
└── index.ts        # Main entry point
```

### Building from Source

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Start development server
npm run dev
```

### Adding New Features

1. **Security Analyzers**: Add new checks in `src/services/security.ts`
2. **DEX Integration**: Extend swap logic in `src/services/sniper.ts`
3. **Notifications**: Add new notification types in `src/services/notifications.ts`
4. **UI Components**: Modify web interface in `src/web/`

## 🛡️ Security Considerations

### Private Key Security
- Never commit private keys to version control
- Use hardware wallets for production (when supported)
- Consider using environment-specific key management

### RPC Security
- Use rate-limited RPC endpoints for production
- Implement connection pooling for high-volume trading
- Monitor RPC usage and costs

### Smart Contract Risks
- Always verify token contracts before trading
- Be aware of honeypot and rug pull risks
- Understand impermanent loss in liquidity pools

## 📈 Performance Optimization

### RPC Configuration
- Use premium RPC endpoints (QuickNode, Helius, etc.)
- Enable WebSocket connections for real-time data
- Implement connection retry and failover logic

### Transaction Optimization
- Use priority fees for faster confirmation
- Batch transactions when possible
- Monitor network congestion

### Memory Management
- Limit stored transaction history
- Clean up old position data
- Monitor memory usage in production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Add tests for new features
- Update documentation
- Ensure backwards compatibility

## 📞 Support

For issues and questions:
1. Check existing GitHub issues
2. Review documentation thoroughly
3. Test with small amounts first
4. Join community discussions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚖️ Legal Notice

This software is for educational and research purposes. Users are responsible for:
- Compliance with local laws and regulations
- Understanding financial risks involved
- Proper security practices
- Tax obligations from trading activities

The developers assume no responsibility for financial losses or legal issues arising from the use of this software.

---

**Remember**: Never invest more than you can afford to lose. Cryptocurrency trading is highly risky and speculative.