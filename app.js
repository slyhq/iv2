// Configuration
const CONFIG = {
    dataPath: 'data/forum_data.json',
    updateInterval: 3600000, // 1 hour in milliseconds
    lastUpdatedKey: 'forum_data_last_updated'
};

// Main function to initialize the application
async function initApp() {
    try {
        // Show loading indicator
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('forum-container').classList.add('hidden');
        
        // Load the forum data
        const forumData = await loadForumData();
        
        // Render the forum data
        renderForumData(forumData);
        
        // Hide loading indicator, show content
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('forum-container').classList.remove('hidden');
    } catch (error) {
        console.error('Error initializing app:', error);
        document.getElementById('loading').innerHTML = `
            <div class="error-message">
                <h2>Error Loading Forum Data</h2>
                <p>${error.message}</p>
                <button onclick="initApp()">Try Again</button>
            </div>
        `;
    }
}

// Function to load forum data
async function loadForumData() {
    try {
        const response = await fetch(CONFIG.dataPath);
        if (!response.ok) {
            throw new Error(`Failed to load forum data: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading forum data:', error);
        throw new Error('Could not load forum data. Please try again later.');
    }
}

// Function to render forum data
function renderForumData(data) {
    const container = document.getElementById('forum-container');
    
    // Clear existing content
    container.innerHTML = '';
    
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
    } else if (data.topics && data.topics.length > 0) {
        // Render topics directly
        container.appendChild(createTopicListElement(data.topics));
    } else if (data.posts && data.posts.length > 0) {
        // Render posts directly
        container.appendChild(createPostListElement(data.posts));
    } else {
        container.innerHTML = '<div class="empty-state">No forum data available.</div>';
    }
    
    // Add last updated info
    const lastUpdated = new Date().toLocaleString();
    localStorage.setItem(CONFIG.lastUpdatedKey, lastUpdated);
    
    const updateInfo = document.createElement('div');
    updateInfo.className = 'update-info';
    updateInfo.textContent = `Last updated: ${lastUpdated}`;
    container.appendChild(updateInfo);
}

// Helper function to create a category element
function createCategoryElement(category) {
    const categoryElement = document.createElement('div');
    categoryElement.className = 'forum-category';
    categoryElement.innerHTML = `
        <div class="category-header">
            <h2 class="category-title">${category.name}</h2>
        </div>
    `;
    
    if (category.forums && category.forums.length > 0) {
        const forumList = document.createElement('ul');
        forumList.className = 'forum-list';
        
        category.forums.forEach(forum => {
            const forumItem = document.createElement('li');
            forumItem.className = 'forum-item';
            forumItem.innerHTML = `
                <a href="#" class="forum-link" data-forum-id="${forum.id}">
                    <div class="forum-title">${forum.name}</div>
                    <div class="forum-description">${forum.description || ''}</div>
                    <div class="forum-stats">
                        Topics: ${forum.topic_count || 0} | 
                        Posts: ${forum.post_count || 0}
                    </div>
                </a>
            `;
            
            // Add event listener to load topics when clicked
            forumItem.querySelector('.forum-link').addEventListener('click', (e) => {
                e.preventDefault();
                loadForumTopics(forum.id);
            });
            
            forumList.appendChild(forumItem);
        });
        
        categoryElement.appendChild(forumList);
    } else {
        categoryElement.innerHTML += '<div class="empty-forums">No forums in this category</div>';
    }
    
    return categoryElement;
}

// Function to create a topic list element
function createTopicListElement(topics) {
    const topicListContainer = document.createElement('div');
    topicListContainer.className = 'topic-container';
    
    const topicList = document.createElement('ul');
    topicList.className = 'topic-list';
    
    topics.forEach(topic => {
        const topicItem = document.createElement('li');
        topicItem.className = 'topic-item';
        topicItem.innerHTML = `
            <div class="topic-header">
                <a href="#" class="topic-title" data-topic-id="${topic.id}">${topic.title}</a>
            </div>
            <div class="topic-meta">
                <span class="topic-author">By: ${topic.author || 'Unknown'}</span>
                <span class="topic-date">Posted: ${formatDate(topic.created_at)}</span>
                <span class="topic-replies">Replies: ${topic.reply_count || 0}</span>
            </div>
        `;
        
        // Add event listener to load posts when clicked
        topicItem.querySelector('.topic-title').addEventListener('click', (e) => {
            e.preventDefault();
            loadTopicPosts(topic.id);
        });
        
        topicList.appendChild(topicItem);
    });
    
    topicListContainer.appendChild(topicList);
    return topicListContainer;
}

// Function to create a post list element
function createPostListElement(posts) {
    const postListContainer = document.createElement('div');
    postListContainer.className = 'post-container';
    
    const postList = document.createElement('ul');
    postList.className = 'post-list';
    
    posts.forEach(post => {
        const postItem = document.createElement('li');
        postItem.className = 'post-item';
        postItem.innerHTML = `
            <div class="post-header">
                <span class="post-author">${post.author || 'Unknown'}</span>
                <span class="post-date">${formatDate(post.created_at)}</span>
            </div>
            <div class="post-content">${post.content || ''}</div>
        `;
        
        postList.appendChild(postItem);
    });
    
    postListContainer.appendChild(postList);
    return postListContainer;
}

// Helper function to format dates
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Function to load topics for a specific forum
async function loadForumTopics(forumId) {
    try {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('forum-container').classList.add('hidden');
        
        // In a real implementation, you might load from a different file or endpoint
        // Here we'll just filter the existing data
        const forumData = await loadForumData();
        
        const topics = forumData.topics.filter(topic => topic.forum_id === forumId);
        
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('forum-container').classList.remove('hidden');
        
        // Render just the topics
        const container = document.getElementById('forum-container');
        container.innerHTML = '';
        
        // Add back button
        const backButton = document.createElement('button');
        backButton.className = 'back-button';
        backButton.textContent = '← Back to Forums';
        backButton.addEventListener('click', () => {
            initApp(); // Reload the main forum view
        });
        container.appendChild(backButton);
        
        // Add forum title
        const forum = forumData.forums.find(f => f.id === forumId);
        const forumTitle = document.createElement('h2');
        forumTitle.className = 'page-title';
        forumTitle.textContent = forum ? forum.name : 'Forum Topics';
        container.appendChild(forumTitle);
        
        container.appendChild(createTopicListElement(topics));
    } catch (error) {
        console.error('Error loading forum topics:', error);
        document.getElementById('loading').innerHTML = `
            <div class="error-message">
                <h2>Error Loading Topics</h2>
                <p>${error.message}</p>
                <button onclick="initApp()">Back to Forums</button>
            </div>
        `;
    }
}

// Function to load posts for a specific topic
async function loadTopicPosts(topicId) {
    try {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('forum-container').classList.add('hidden');
        
        // In a real implementation, you might load from a different file or endpoint
        const forumData = await loadForumData();
        
        const posts = forumData.posts.filter(post => post.topic_id === topicId);
        
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('forum-container').classList.remove('hidden');
        
        // Render just the posts
        const container = document.getElementById('forum-container');
        container.innerHTML = '';
        
        // Add back button
        const backButton = document.createElement('button');
        backButton.className = 'back-button';
        backButton.textContent = '← Back to Topics';
        backButton.addEventListener('click', () => {
            // Find the forum ID for this topic
            const topic = forumData.topics.find(t => t.id === topicId);
            if (topic && topic.forum_id) {
                loadForumTopics(topic.forum_id);
            } else {
                initApp(); // Fallback to main view
            }
        });
        container.appendChild(backButton);
        
        // Add topic title
        const topic = forumData.topics.find(t => t.id === topicId);
        const topicTitle = document.createElement('h2');
        topicTitle.className = 'page-title';
        topicTitle.textContent = topic ? topic.title : 'Topic Posts';
        container.appendChild(topicTitle);
        
        container.appendChild(createPostListElement(posts));
    } catch (error) {
        console.error('Error loading topic posts:', error);
        document.getElementById('loading').innerHTML = `
            <div class="error-message">
                <h2>Error Loading Posts</h2>
                <p>${error.message}</p>
                <button onclick="initApp()">Back to Forums</button>
            </div>
        `;
    }
}

// Check for data updates periodically
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
