// Add first page if not included
        if (startPage > 1) {
            addPageButton(numbersContainer, 1);
            if (startPage > 2) {
                addEllipsis(numbersContainer);
            }
        }
        
        // Add visible page numbers
        for (let i = startPage; i <= endPage; i++) {
            addPageButton(numbersContainer, i);
        }
        
        // Add last page if not included
        if (endPage < AppState.totalPages) {
            if (endPage < AppState.totalPages - 1) {
                addEllipsis(numbersContainer);
            }
            addPageButton(numbersContainer, AppState.totalPages);
        }
        
        paginationContainer.appendChild(element);
    } catch (error) {
        console.error('Error rendering pagination:', error);
    }
}

/**
 * Add a page number button to pagination
 */
function addPageButton(container, pageNum) {
    if (!container) return;
    
    try {
        const button = document.createElement('button');
        button.className = 'pagination-number';
        button.setAttribute('aria-label', `Page ${pageNum}`);
        
        if (pageNum === AppState.currentPage) {
            button.classList.add('current');
            button.setAttribute('aria-current', 'page');
        }
        
        button.textContent = pageNum;
        
        button.addEventListener('click', () => {
            if (pageNum !== AppState.currentPage) {
                AppState.currentPage = pageNum;
                initApp();
            }
        });
        
        container.appendChild(button);
    } catch (error) {
        console.error('Error adding page button:', error);
    }
}

/**
 * Add ellipsis to pagination
 */
function addEllipsis(container) {
    if (!container) return;
    
    try {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'pagination-ellipsis';
        ellipsis.setAttribute('aria-hidden', 'true');
        ellipsis.textContent = '...';
        container.appendChild(ellipsis);
    } catch (error) {
        console.error('Error adding ellipsis:', error);
    }
}

/**
 * Render last updated information
 */
function renderLastUpdatedInfo() {
    if (!AppState.lastUpdated) return;
    
    const container = DOM.forumContainer();
    if (!container) return;
    
    try {
        const updateInfo = document.createElement('div');
        updateInfo.className = 'update-info';
        updateInfo.textContent = `Last updated: ${AppState.lastUpdated}`;
        container.appendChild(updateInfo);
    } catch (error) {
        console.error('Error rendering last updated info:', error);
    }
}

/**
 * Helper functions for formatting dates
 */
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        // Check if date is within the last 24 hours
        const now = new Date();
        const diff = now - date;
        const oneDay = 24 * 60 * 60 * 1000;
        
        if (diff < oneDay) {
            // Show relative time for recent dates
            return formatRelativeTime(diff);
        } else {
            // Show full date for older dates
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        }
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Unknown';
    }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(timeDiff) {
    if (isNaN(timeDiff)) return 'Unknown';
    
    try {
        const seconds = Math.floor(timeDiff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (seconds < 60) {
            return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
        } else if (minutes < 60) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        } else {
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        }
    } catch (error) {
        console.error('Error formatting relative time:', error);
        return 'Recently';
    }
}

/**
 * Show loading indicator
 */
function showLoading() {
    const loading = DOM.loading();
    const container = DOM.forumContainer();
    
    if (loading) {
        loading.classList.remove('hidden');
        loading.setAttribute('aria-busy', 'true');
        loading.setAttribute('aria-label', 'Loading content');
    }
    
    if (container) {
        container.classList.add('hidden');
        container.setAttribute('aria-hidden', 'true');
    }
}

/**
 * Hide loading indicator
 */
function hideLoading() {
    const loading = DOM.loading();
    const container = DOM.forumContainer();
    
    if (loading) {
        loading.classList.add('hidden');
        loading.setAttribute('aria-busy', 'false');
    }
    
    if (container) {
        container.classList.remove('hidden');
        container.removeAttribute('aria-hidden');
    }
}

/**
 * Handle errors
 */
function handleError(context, error) {
    console.error(`${context}:`, error);
    
    const loading = DOM.loading();
    if (loading) {
        loading.innerHTML = `
            <div class="error-message" role="alert">
                <h2>Error</h2>
                <p>${error.message || 'An unknown error occurred'}</p>
                <button onclick="initApp()">Try Again</button>
            </div>
        `;
        loading.classList.remove('hidden');
    }
}

/**
 * Check for data updates periodically
 */
function setupDataUpdateChecker() {
    // Only set up interval if localStorage is available
    if (!isLocalStorageAvailable()) return;
    
    setInterval(() => {
        const lastUpdated = localStorage.getItem(CONFIG.lastUpdatedKey);
        if (lastUpdated) {
            const lastUpdatedTime = new Date(lastUpdated).getTime();
            const currentTime = new Date().getTime();
            
            if (!isNaN(lastUpdatedTime) && currentTime - lastUpdatedTime > CONFIG.updateInterval) {
                console.log('Checking for updated forum data...');
                initApp();
            }
        }
    }, CONFIG.updateInterval);
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupDataUpdateChecker();
});

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initApp,
        loadForumData,
        formatDate,
        isLocalStorageAvailable,
        sanitizeHTML
    };
}
