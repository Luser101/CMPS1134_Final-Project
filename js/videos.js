/**
 * Videos Gallery Script
 * Dynamically loads and displays videos from the team_video folder
 */

// Video list - manually defined since we can't read folder dynamically in browser
const videosList = [
  {
    name: 'Adrian_Morris_Networking_and _the_Internet.mp4',
    title: 'Networking and the Internet',
    author: 'Adrian Morris',
    description: 'An comprehensive exploration of networking concepts and how the internet works.',
    duration: '12:45'
  },
  {
    name: 'Lisandro_Figueroa_Algorithms.mp4',
    title: 'Algorithms',
    author: 'Lisandro Figueroa',
    description: 'A deep dive into fundamental algorithms and their implementations.',
    duration: '15:30'
  },
  {
    name: 'operation_sytem_Derick_Cal.mp4',
    title: 'Operating Systems',
    author: 'Derick Cal',
    description: 'Understanding the core concepts of operating systems and their architecture.',
    duration: '18:20'
  },
  {
    name: 'Programing languages video 1.mp4',
    title: 'Programming Languages',
    author: 'Team Member',
    description: 'Introduction to various programming languages and their characteristics.',
    duration: '14:15'
  }
];

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('📹 Videos gallery loaded');
  loadVideos();
  setupEventListeners();
});

/**
 * Load videos into the gallery
 */
function loadVideos() {
  const videoContainer = document.getElementById('video-container');
  const videoCountElement = document.getElementById('video-count');
  
  if (!videoContainer) {
    console.error('❌ Video container not found');
    return;
  }

  // Clear loading spinner
  videoContainer.innerHTML = '';

  // Create video items
  videosList.forEach((video, index) => {
    const videoItem = createVideoElement(video, index);
    videoContainer.appendChild(videoItem);
  });

  // Update video count
  if (videoCountElement) {
    videoCountElement.textContent = videosList.length;
  }

  console.log(`✅ Loaded ${videosList.length} videos`);
}

/**
 * Create a video element
 */
function createVideoElement(video, index) {
  const videoItem = document.createElement('div');
  videoItem.className = 'video-item';
  videoItem.style.animationDelay = `${index * 0.1}s`;

  const videoPath = `../team_video/${video.name}`;

  videoItem.innerHTML = `
    <div class="video-player-wrapper">
      <video controls>
        <source src="${videoPath}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    </div>
    <div class="video-info">
      <h3 class="video-title">${video.title}</h3>
      <p class="video-author" style="font-size: 0.9rem; color: #6366f1; margin-bottom: 8px;">By ${video.author}</p>
      <p class="video-description">${video.description}</p>
      <div class="video-meta">
        <span class="video-duration">${video.duration}</span>
        <button class="watch-button" onclick="expandVideo(this)">Watch Fullscreen</button>
      </div>
    </div>
  `;

  return videoItem;
}

/**
 * Expand video to fullscreen modal
 */
function expandVideo(button) {
  const videoElement = button.closest('.video-item').querySelector('video');
  const videoClone = videoElement.cloneNode(true);

  // Create modal if it doesn't exist
  let modal = document.getElementById('video-player-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'video-player-modal';
    modal.className = 'video-player-modal';
    modal.innerHTML = `
      <div class="video-player-modal-content">
        <button class="close-player-modal" onclick="closePlayerModal()">×</button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Add video to modal
  const contentDiv = modal.querySelector('.video-player-modal-content');
  contentDiv.querySelector('video')?.remove();
  videoClone.style.width = '100%';
  videoClone.style.height = '100%';
  contentDiv.appendChild(videoClone);

  // Show modal
  modal.classList.add('open');
  videoClone.play();

  console.log('▶️ Expanded video to fullscreen');
}

/**
 * Close fullscreen video modal
 */
function closePlayerModal() {
  const modal = document.getElementById('video-player-modal');
  if (modal) {
    const video = modal.querySelector('video');
    if (video) {
      video.pause();
      video.remove();
    }
    modal.classList.remove('open');
    console.log('⏹️ Closed fullscreen player');
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Close modal on background click
  document.addEventListener('click', (e) => {
    const modal = document.getElementById('video-player-modal');
    if (modal && e.target === modal) {
      closePlayerModal();
    }
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closePlayerModal();
    }
  });

  console.log('✅ Event listeners setup complete');
}

/**
 * Search videos by title or author
 */
function searchVideos(query) {
  const filtered = videosList.filter(video => 
    video.title.toLowerCase().includes(query.toLowerCase()) ||
    video.author.toLowerCase().includes(query.toLowerCase())
  );

  const videoContainer = document.getElementById('video-container');
  videoContainer.innerHTML = '';

  filtered.forEach((video, index) => {
    const videoItem = createVideoElement(video, index);
    videoContainer.appendChild(videoItem);
  });

  console.log(`🔍 Search results: ${filtered.length} videos found`);
}
