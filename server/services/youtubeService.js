import axios from 'axios';

class YouTubeService {
  constructor() {
    this.baseURL = 'https://www.googleapis.com/youtube/v3';
  }

  /**
   * Search for movie trailer on YouTube
   * @param {string} movieTitle - The title of the movie
   * @param {string} year - Release year for better search results
   * @returns {Promise<string>} - YouTube video URL
   */
  async searchMovieTrailer(movieTitle, year = null) {
    try {
      const apiKey = process.env.YOUTUBE_API_KEY;
      
      if (!apiKey) {
        console.warn('YouTube API key not found, skipping trailer fetch');
        return null;
      }

      // Construct search query with movie title and year for better results
      let searchQuery = `${movieTitle} official trailer`;
      if (year) {
        searchQuery += ` ${year}`;
      }

      const response = await axios.get(`${this.baseURL}/search`, {
        params: {
          part: 'snippet',
          q: searchQuery,
          type: 'video',
          maxResults: 5,
          key: apiKey,
          videoEmbeddable: true,
          order: 'relevance'
        }
      });

      const videos = response.data.items;
      
      if (videos.length === 0) {
        console.warn(`No trailer found for movie: ${movieTitle}`);
        return null;
      }

      // Prioritize official trailers and high-quality sources
      const prioritizedVideo = this.prioritizeVideo(videos, movieTitle);
      
      if (prioritizedVideo) {
        return `https://www.youtube.com/watch?v=${prioritizedVideo.id.videoId}`;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching trailer for ${movieTitle}:`, error);
      return null;
    }
  }

  /**
   * Prioritize official trailers and high-quality sources
   * @param {Array} videos - Array of YouTube video objects
   * @param {string} movieTitle - The movie title for matching
   * @returns {Object} - Prioritized video object
   */
  prioritizeVideo(videos, movieTitle) {
    // Priority order for channel names
    const priorityChannels = [
      'Official Trailer',
      'Movie Trailers',
      'Trailers',
      'Warner Bros. Pictures',
      'Walt Disney Studios',
      'Universal Pictures',
      'Sony Pictures',
      '20th Century Studios',
      'Paramount Pictures'
    ];

    // First, try to find exact match with official trailer
    for (const video of videos) {
      const title = video.snippet.title.toLowerCase();
      const channel = video.snippet.channelTitle.toLowerCase();
      
      // Check for exact title match with "official trailer"
      if (title.includes(movieTitle.toLowerCase()) && 
          title.includes('official trailer') &&
          title.includes('hd')) {
        return video;
      }
    }

    // Then check for priority channels
    for (const priorityChannel of priorityChannels) {
      for (const video of videos) {
        if (video.snippet.channelTitle.toLowerCase().includes(priorityChannel.toLowerCase())) {
          return video;
        }
      }
    }

    // Finally, return the first video as fallback
    return videos[0];
  }

  /**
   * Get video thumbnail URL
   * @param {string} videoId - YouTube video ID
   * @returns {string} - Thumbnail URL
   */
  getThumbnailUrl(videoId) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }

  /**
   * Extract video ID from YouTube URL
   * @param {string} url - YouTube URL
   * @returns {string} - Video ID
   */
  extractVideoId(url) {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Validate YouTube URL
   * @param {string} url - URL to validate
   * @returns {boolean} - Whether URL is valid YouTube URL
   */
  isValidYouTubeUrl(url) {
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[^\s&]+$/;
    return regex.test(url);
  }
}

export default new YouTubeService();
