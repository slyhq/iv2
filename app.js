/**
 * IV2 - Modern Interface for אידישע וועלט Forum
 * Main Application JavaScript
 */

// Configuration settings
const CONFIG = {
    dataPath: 'data/forum_data.json',
    updateInterval: 3600000, // 1 hour in milliseconds
    lastUpdatedKey: 'forum_data_last_updated',
    animationDuration: 300, // ms for animations
    itemsPerPage: 20 // Default pagination
};

// DOM Elements cache for better performance
const DOM = {
    loading: () => document.getElementById('loading'),
    forumContainer: () => document.getElementById('forum-container'),
    pagination: () => document.getElementById('pagination'),
    menuToggle: () => document.getElementById('menu-toggle'),
    mainNav: () => document.getElementById('main-nav')
};

// Templates cache
const TEMPLATES = {
    category: () => document.getElementById('category-template'),
    forum: () => document.getElementById('forum-template'),
    topic: () => document.getElementById('topic-template'),
    post: () => document.getElementById('post-template'),
    breadcrumb: () => document.getElementById('breadcrumb-template'),
    pagination: () => document.getElementById('pagination-template')
};

/**
 * Main application state
 */
const AppState = {
    currentView: 'forums', // forums, topics, posts
    currentForumId: null,
    currentTopicId: null,
    currentPage: 1,
    totalPages: 1,
    breadcrumbs: [],
    lastUpdated: null,
    
    // Update breadcrumbs based on current navigation state
    updateBreadcrumbs(data) {
        this.breadcrumbs = [{name: 'היים', link: '#', action: 'home'}];
        
        if (this.currentView === 'topics' && this.currentForumId) {
            const forum = data.forums.find(f => f.id === this.currentForumId);
            if (forum) {
                this.breadcrumbs.push({
                    name: forum.name,
                    link: '#',
                    action: 'forum',
                    id: forum.id
                });
            }
        } else if (this.currentView === 'posts' && this.currentTopicId) {
            const topic = data.topics.find(t => t.id === this.currentTopicId);
            if (topic) {
                const forum = data.forums.find(f => f.id === topic.forum_id);
                if (forum) {
                    this.breadcrumbs.push({
                        name: forum.name,
                        link: '#',
                        action: 'forum',
                        id: forum.id
                    });
                }
                this.breadcrumbs.push({
                    name: topic.title,
                    link: '#',
                    action: 'topic',
                    id: topic.id
                });
            }
        }
        
        return this.breadcrumbs;
    },
    
    // Reset to home view
    resetToHome() {
        this.currentView = 'forums';
        this.currentForumId = null;
        this.currentTopicId = null;
        this.currentPage = 1;
        this.breadcrumbs = [];
    }
};

/**
 * Initialize the application
 */
async function initApp() {
    try {
        showLoading();
        
        // Setup event listeners
        setupEventListeners();
        
        // Load the forum data
        const forumData = await loadForumData();
        
        // Render the appropriate view based on application state
        renderView(forumData);
        
        hideLoading();
    } catch (error) {
        handleError('Error initializing app', error);
    }
}

/**
 * Setup global event listeners
 */
function setupEventListeners() {
    // Mobile menu toggle
    const menuToggle = DOM.menuToggle();
    const mainNav = DOM.mainNav();
    
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
        });
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (mainNav && mainNav.classList.contains('active') && 
            !mainNav.contains(e.target) && 
            !menuToggle.contains(e.target)) {
            mainNav.classList.remove('active');
        }
    });
}

/**
 * Load forum data from JSON file
 */
async function loadForumData() {
    try {
        const response = await fetch(CONFIG.dataPath);
        if (!response.ok) {
            throw new Error(`Failed to load forum data: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        saveLastUpdated();
        return data;
    } catch (error) {
        console.error('Error loading forum data:', error);
        throw new Error('Could not load forum data. Please try again later.');
    }
}

/**
 * Save last updated timestamp
 */
function saveLastUpdated() {
    const lastUpdated = new Date().toLocaleString();
    localStorage.setItem(CONFIG.lastUpdatedKey, lastUpdated);
    AppState.lastUpdated = lastUpdated;
}

/**
 * Render the appropriate view based on application state
 */
function renderView(data) {
    const container = DOM.forumContainer();
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Render breadcrumbs
    renderBreadcrumbs(AppState.updateBreadcrumbs(data));
    
    // Render content based on current view
    switch (AppState.currentView) {
        case 'forums':
            renderForumData(data);
            break;
        case 'topics':
            renderTopics(data);
            break;
        case 'posts':
            renderPosts(data);
            break;
        default:
            renderForumData(data);
    }
    
    // Add last updated info
    renderLastUpdatedInfo();
}

/**
 * Render forum categories and forums
 */
function renderForumData(data) {
    const container = DOM.forumContainer();
    
    if (data.categories && data.categories.length > 0) {
        // Render categories and forums
        data.categories.forEach(category => {
            container.appendChild(createCategoryElement(category));
        });
    } else if (data.forums && data.forums.length > 0) {
        // Render forums directly if no categories
        const defaultCategory = {
            id: 'default',
            name: 'Forums',
            forums: data.forums
        };
        container.appendChild(createCategoryElement(defaultCategory));
    } else {
        container.innerHTML = '<div class="empty-state">No forum data available.</div>';
    }
}

/**
 * Create a category element with its forums
 */
function createCategoryElement(category) {
    const template = TEMPLATES.category();
    const element = document.importNode(template.content.cloneNode(true), true);
    
    // Set category title
    element.querySelector('.category-title').textContent = category.name;
    
    const forumListContainer = element.querySelector('.forum-list');
    
    if (category.forums && category.forums.length > 0) {
        category.forums.forEach(forum => {
            forumListContainer.appendChild(createForumElement(forum));
        });
    } else {
        const emptyElement = document.createElement('div');
        emptyElement.className = 'empty-forums';
        emptyElement.textContent = 'No forums in this category';
        forumListContainer.appendChild(emptyElement);
    }
    
    return element;
}

/**
 * Create a forum element
 */
function createForumElement(forum) {
    const template = TEMPLATES.forum();
    const element = document.importNode(template.content.cloneNode(true), true);
    
    // Set forum details
    element.querySelector('.forum-title').textContent = forum.name;
    element.querySelector('.forum-description').textContent = forum.description || '';
    element.querySelector('.topics-count').textContent = forum.topic_count || 0;
    element.querySelector('.posts-count').textContent = forum.post_count || 0;
    
    // Set last post info if available
    if (forum.last_post) {
        element.querySelector('.last-post-title').textContent = forum.last_post.title || '';
        element.querySelector('.last-post-by').textContent = `By: ${forum.last_post.author || 'Unknown'}`;
        element.querySelector('.last-post-time').textContent = formatDate(forum.last_post.created_at);
    }
    
    // Add event listener for forum click
    element.querySelector('.forum-item').addEventListener('click', () => {
        navigateToForum(forum.id);
    });
    
    return element;
}

/**
 * Navigate to a specific forum
 */
async function navigateToForum(forumId) {
    try {
        showLoading();
        
        AppState.currentView = 'topics';
        AppState.currentForumId = forumId;
        AppState.currentTopicId = null;
        AppState.currentPage = 1;
        
        const forumData = await loadForumData();
        renderView(forumData);
        
        hideLoading();
    } catch (error) {
        handleError('Error loading forum topics', error);
    }
}

/**
 * Render topics for the current forum
 */
function renderTopics(data) {
    const container = DOM.forumContainer();
    const forumId = AppState.currentForumId;
    
    // Filter topics for current forum
    const topics = data.topics.filter(topic => topic.forum_id === forumId);
    
    if (topics.length === 0) {
        container.innerHTML += '<div class="empty-state">No topics available in this forum.</div>';
        return;
    }
    
    // Get forum info
    const forum = data.forums.find(f => f.id === forumId);
    if (forum) {
        const forumTitle = document.createElement('h2');
        forumTitle.className = 'forum-title heading';
        forumTitle.textContent = forum.name;
        container.appendChild(forumTitle);
    }
    
    // Create topics list
    const topicsList = document.createElement('div');
    topicsList.className = 'topics-list';
    
    // Implement pagination
    const page = AppState.currentPage;
    const itemsPerPage = CONFIG.itemsPerPage;
    const startIndex = (page - 1) * itemsPerPage;
    const paginatedTopics = topics.slice(startIndex, startIndex + itemsPerPage);
    
    AppState.totalPages = Math.ceil(topics.length / itemsPerPage);
    
    // Create topic elements
    paginatedTopics.forEach(topic => {
        topicsList.appendChild(createTopicElement(topic));
    });
    
    container.appendChild(topicsList);
    
    // Render pagination
    renderPagination();
}

/**
 * Create a topic element
 */
function createTopicElement(topic) {
    const template = TEMPLATES.topic();
    const element = document.importNode(template.content.cloneNode(true), true);
    
    // Set topic details
    element.querySelector('.topic-title').textContent = topic.title;
    element.querySelector('.topic-starter').textContent = `By: ${topic.author || 'Unknown'}`;
    element.querySelector('.topic-time').textContent = formatDate(topic.created_at);
    element.querySelector('.replies-count').textContent = topic.reply_count || 0;
    element.querySelector('.views-count').textContent = topic.views || 0;
    
    // Set last post info if available
    if (topic.last_post) {
        element.querySelector('.last-post-by').textContent = topic.last_post.author || 'Unknown';
        element.querySelector('.last-post-time').textContent = formatDate(topic.last_post.created_at);
    }
    
    // Add event listener for topic click
    element.querySelector('.topic-item').addEventListener('click', () => {
        navigateToTopic(topic.id);
    });
    
    return element;
}

/**
 * Navigate to a specific topic
 */
async function navigateToTopic(topicId) {
    try {
        showLoading();
        
        AppState.currentView = 'posts';
        AppState.currentTopicId = topicId;
        AppState.currentPage = 1;
        
        const forumData = await loadForumData();
        renderView(forumData);
        
        hideLoading();
    } catch (error) {
        handleError('Error loading topic posts', error);
    }
}

/**
 * Render posts for the current topic
 */
function renderPosts(data) {
    const container = DOM.forumContainer();
    const topicId = AppState.currentTopicId;
    
    // Filter posts for current topic
    const posts = data.posts.filter(post => post.topic_id === topicId);
    
    if (posts.length === 0) {
        container.innerHTML += '<div class="empty-state">No posts available in this topic.</div>';
        return;
    }
    
    // Get topic info
    const topic = data.topics.find(t => t.id === topicId);
    if (topic) {
        const topicTitle = document.createElement('h2');
        topicTitle.className = 'topic-title heading';
        topicTitle.textContent = topic.title;
        container.appendChild(topicTitle);
    }
    
    // Create posts list
    const postsList = document.createElement('div');
    postsList.className = 'posts-list';
    
    // Implement pagination
    const page = AppState.currentPage;
    const itemsPerPage = CONFIG.itemsPerPage;
    const startIndex = (page - 1) * itemsPerPage;
    const paginatedPosts = posts.slice(startIndex, startIndex + itemsPerPage);
    
    AppState.totalPages = Math.ceil(posts.length / itemsPerPage);
    
    // Create post elements
    paginatedPosts.forEach(post => {
        postsList.appendChild(createPostElement(post));
    });
    
    container.appendChild(postsList);
    
    // Render pagination
    renderPagination();
}

/**
 * Create a post element
 */
function createPostElement(post) {
    const template = TEMPLATES.post();
    const element = document.importNode(template.content.cloneNode(true), true);
    
    // Set post details
    element.querySelector('.post-author-name').textContent = post.author || 'Unknown';
    element.querySelector('.post-author-rank').textContent = post.author_rank || 'Member';
    element.querySelector('.post-time').textContent = formatDate(post.created_at);
    element.querySelector('.post-content').innerHTML = post.content || '';
    
    // Set post number if available
    if (post.number) {
        element.querySelector('.post-number').textContent = `#${post.number}`;
    }
    
    // Add event listeners for post actions
    element.querySelector('.post-action.quote').addEventListener('click', () => {
        handleQuotePost(post);
    });
    
    element.querySelector('.post-action.share').addEventListener('click', () => {
        handleSharePost(post);
    });
    
    return element;
}

/**
 * Handle quoting a post
 */
function handleQuotePost(post) {
    // This would be implemented when adding reply functionality
    console.log('Quote post:', post.id);
    alert('Quote functionality will be implemented in a future update.');
}

/**
 * Handle sharing a post
 */
function handleSharePost(post) {
    // Simple sharing mechanism - copy URL with post ID
    const url = `${window.location.origin}${window.location.pathname}?topic=${AppState.currentTopicId}&post=${post.id}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
        alert('Post URL copied to clipboard!');
    }).catch(err => {
        console.error('Could not copy URL: ', err);
        alert('Could not copy URL to clipboard. Please copy it manually: ' + url);
    });
}

/**
 * Render breadcrumbs navigation
 */
function renderBreadcrumbs(breadcrumbs) {
    if (!breadcrumbs || breadcrumbs.length <= 1) return;
    
    const container = DOM.forumContainer();
    const template = TEMPLATES.breadcrumb();
    const element = document.importNode(template.content.cloneNode(true), true);
    
    const breadcrumbList = element.querySelector('.breadcrumb-list');
    
    // Remove default home item (we'll add all items from our state)
    breadcrumbList.innerHTML = '';
    
    // Add all breadcrumb items
    breadcrumbs.forEach((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const listItem = document.createElement('li');
        listItem.className = 'breadcrumb-item';
        
        const link = document.createElement('a');
        link.className = isLast ? 'breadcrumb-link current' : 'breadcrumb-link';
        link.textContent = item.name;
        link.href = item.link;
        
        // Add event listener based on action type
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (item.action === 'home') {
                AppState.resetToHome();
                initApp();
            } else if (item.action === 'forum' && item.id) {
                navigateToForum(item.id);
            } else if (item.action === 'topic' && item.id && !isLast) {
                navigateToTopic(item.id);
            }
        });
        
        listItem.appendChild(link);
        
        // Add separator if not last item
        if (!isLast) {
            const separator = document.createElement('span');
            separator.className = 'breadcrumb-separator';
            separator.innerHTML = '<i class="fas fa-chevron-left"></i>';
            listItem.appendChild(separator);
        }
        
        breadcrumbList.appendChild(listItem);
    });
    
    container.appendChild(element);
}

/**
 * Render pagination controls
 */
function renderPagination() {
    const paginationContainer = DOM.pagination();
    if (!paginationContainer) return;
    
    paginationContainer.innerHTML = '';
    
    if (AppState.totalPages <= 1) return;
    
    const template = TEMPLATES.pagination();
    const element = document.importNode(template.content.cloneNode(true), true);
    
    const prevButton = element.querySelector('.pagination-button.prev');
    const nextButton = element.querySelector('.pagination-button.next');
    const numbersContainer = element.querySelector('.pagination-numbers');
    
    // Disable prev button if on first page
    if (AppState.currentPage <= 1) {
        prevButton.disabled = true;
    }
    
    // Disable next button if on last page
    if (AppState.currentPage >= AppState.totalPages) {
        nextButton.disabled = true;
    }
    
    // Add event listeners for pagination buttons
    prevButton.addEventListener('click', () => {
        if (AppState.currentPage > 1) {
            AppState.currentPage--;
            initApp();
        }
    });
    
    nextButton.addEventListener('click', () => {
        if (AppState.currentPage < AppState.totalPages) {
            AppState.currentPage++;
            initApp();
        }
    });
    
    // Create page number buttons
    const maxVisiblePages = 5;
    let startPage = Math.max(1, AppState.currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(AppState.totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
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
}

/**
 * Add a page number button to pagination
 */
function addPageButton(container, pageNum) {
    const button = document.createElement('button');
    button.className = 'pagination-number';
    if (pageNum === AppState.currentPage) {
        button.classList.add('current');
    }
    button.textContent = pageNum;
    
    button.addEventListener('click', () => {
        if (pageNum !== AppState.currentPage) {
            AppState.currentPage = pageNum;
            initApp();
        }
    });
    
    container.appendChild(button);
}

/**
 * Add ellipsis to pagination
 */
function addEllipsis(container) {
    const ellipsis = document.createElement('span');
    ellipsis.className = 'pagination-ellipsis';
    ellipsis.textContent = '...';
    container.appendChild(ellipsis);
}

/**
 * Render last updated information
 */
function renderLastUpdatedInfo() {
    if (!AppState.lastUpdated) return;
    
    const container = DOM.forumContainer();
    const updateInfo = document.createElement('div');
    updateInfo.className = 'update-info';
    updateInfo.textContent = `Last updated: ${AppState.lastUpdated}`;
    container.appendChild(updateInfo);
}

/**
 * Helper functions for formatting dates
 */
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
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
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(timeDiff) {
    const seconds = Math.floor(timeDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (seconds < 60) {
        return `${seconds} seconds ago`;
    } else if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
}

/**
 * Show loading indicator
 */
function showLoading() {
    const loading = DOM.loading();
    const container = DOM.forumContainer();
    
    if (loading) loading.classList.remove('hidden');
    if (container) container.classList.add('hidden');
}

/**
 * Hide loading indicator
 */
function hideLoading() {
    const loading = DOM.loading();
    const container = DOM.forumContainer();
    
    if (loading) loading.classList.add('hidden');
    if (container) container.classList.remove('hidden');
}

/**
 * Handle errors
 */
function handleError(context, error) {
    console.error(`${context}:`, error);
    
    const loading = DOM.loading();
    if (loading) {
        loading.innerHTML = `
            <div class="error-message">
                <h2>Error</h2>
                <p>${error.message}</p>
                <button onclick="initApp()">Try Again</button>
            </div>
        `;
    }
}

/**
 * Check for data updates periodically
 */
setInterval(() => {
    const lastUpdated = localStorage.getItem(CONFIG.lastUpdatedKey);
    if (lastUpdated) {
        const lastUpdatedTime = new Date(lastUpdated).getTime();
        const currentTime = new Date().getTime();
        
        if (currentTime - lastUpdatedTime > CONFIG.updateInterval) {
            console.log('Checking for updated forum data...');
            initApp();
        }
    }
}, CONFIG.updateInterval);

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', initApp);

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initApp,
        loadForumData,
        formatDate
    };
}
