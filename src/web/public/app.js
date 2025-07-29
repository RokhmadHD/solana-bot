class SniperDashboard {
    constructor() {
        this.socket = io();
        this.isMonitoring = false;
        this.initializeEventListeners();
        this.setupSocketHandlers();
    }

    initializeEventListeners() {
        // Toggle monitoring button
        document.getElementById('toggle-monitoring').addEventListener('click', () => {
            this.toggleMonitoring();
        });

        // Request initial data
        this.socket.emit('requestUpdate');
    }

    setupSocketHandlers() {
        this.socket.on('connect', () => {
            this.updateConnectionStatus(true);
        });

        this.socket.on('disconnect', () => {
            this.updateConnectionStatus(false);
        });

        this.socket.on('monitoringData', (data) => {
            this.updateDashboard(data);
        });

        this.socket.on('newToken', (tokenData) => {
            this.showNewTokenAlert(tokenData);
        });
    }

    updateConnectionStatus(connected) {
        const indicator = document.getElementById('status-indicator');
        const text = document.getElementById('status-text');
        
        if (connected) {
            indicator.className = 'w-3 h-3 rounded-full bg-green-500';
            text.textContent = 'Connected';
        } else {
            indicator.className = 'w-3 h-3 rounded-full bg-red-500';
            text.textContent = 'Disconnected';
        }
    }

    async toggleMonitoring() {
        const button = document.getElementById('toggle-monitoring');
        const endpoint = this.isMonitoring ? '/api/stop' : '/api/start';
        
        try {
            const response = await fetch(endpoint, { method: 'POST' });
            const result = await response.json();
            
            if (result.success) {
                this.isMonitoring = !this.isMonitoring;
                button.textContent = this.isMonitoring ? 'Stop Monitoring' : 'Start Monitoring';
                button.className = this.isMonitoring 
                    ? 'px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors'
                    : 'px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors';
            }
        } catch (error) {
            console.error('Failed to toggle monitoring:', error);
        }
    }

    updateDashboard(data) {
        // Update stats
        document.getElementById('total-attempts').textContent = data.totalSnipeAttempts || 0;
        
        const successRate = data.totalSnipeAttempts > 0 
            ? ((data.successfulSnipes / data.totalSnipeAttempts) * 100).toFixed(1)
            : 0;
        document.getElementById('success-rate').textContent = `${successRate}%`;
        
        const pnlElement = document.getElementById('total-pnl');
        const pnl = data.totalProfitLoss || 0;
        pnlElement.textContent = `${pnl.toFixed(4)} SOL`;
        pnlElement.className = pnl >= 0 
            ? 'text-2xl font-bold text-green-500'
            : 'text-2xl font-bold text-red-500';

        // Update recent activity
        this.updateRecentActivity(data.recentActivity || []);
        
        // Update active positions
        this.updateActivePositions(data.activePositions || []);
        
        // Update configuration
        this.updateConfiguration();
    }

    updateRecentActivity(activities) {
        const container = document.getElementById('recent-activity');
        
        if (activities.length === 0) {
            container.innerHTML = '<div class="text-gray-400 text-center py-8">No recent activity</div>';
            return;
        }

        container.innerHTML = activities.map(activity => {
            const statusIcon = activity.success ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-500';
            const statusText = activity.success ? 'Success' : 'Failed';
            const timeAgo = this.formatTimeAgo(new Date(activity.timestamp));
            
            return `
                <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                    <div class="flex items-center space-x-3">
                        <i class="fas ${statusIcon}"></i>
                        <div>
                            <p class="font-medium">${activity.tokenMint.toString().slice(0, 8)}...</p>
                            <p class="text-sm text-gray-400">${activity.amountSol} SOL</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-medium">${statusText}</p>
                        <p class="text-xs text-gray-400">${timeAgo}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateActivePositions(positions) {
        const container = document.getElementById('active-positions');
        
        if (positions.length === 0) {
            container.innerHTML = '<div class="text-gray-400 text-center py-8">No active positions</div>';
            return;
        }

        container.innerHTML = positions.map(position => {
            const pnlPercent = position.profitLossPercent || 0;
            const pnlColor = pnlPercent >= 0 ? 'text-green-500' : 'text-red-500';
            const pnlIcon = pnlPercent >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
            
            return `
                <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                    <div>
                        <p class="font-medium">${position.tokenMint.toString().slice(0, 8)}...</p>
                        <p class="text-sm text-gray-400">${position.costBasisSol} SOL</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-medium ${pnlColor}">
                            <i class="fas ${pnlIcon} mr-1"></i>
                            ${pnlPercent.toFixed(2)}%
                        </p>
                        <p class="text-xs text-gray-400">${position.profitLoss?.toFixed(4) || '0.0000'} SOL</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    async updateConfiguration() {
        try {
            const response = await fetch('/api/config');
            const config = await response.json();
            
            document.getElementById('max-buy-amount').value = config.maxBuyAmountSol;
            document.getElementById('min-liquidity').value = config.minLiquiditySol;
            document.getElementById('max-slippage').value = config.maxSlippagePercent;
            document.getElementById('take-profit').value = config.takeProfitPercent;
            document.getElementById('stop-loss').value = config.stopLossPercent;
            document.getElementById('auto-sell').checked = config.autoSellEnabled;
        } catch (error) {
            console.error('Failed to load configuration:', error);
        }
    }

    showNewTokenAlert(tokenData) {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-purple-600 text-white p-4 rounded-lg shadow-lg z-50';
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fas fa-bell"></i>
                <div>
                    <p class="font-medium">New Token Detected</p>
                    <p class="text-sm">${tokenData.symbol || tokenData.mint.slice(0, 8)}...</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    formatTimeAgo(date) {
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };
        
        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval !== 1 ? 's' : ''} ago`;
            }
        }
        
        return 'Just now';
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    new SniperDashboard();
});