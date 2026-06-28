// portal.js - Collapsible Sidebar & Router Logic

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const closeSidebarBtn = document.getElementById('close-sidebar-btn');
  const openSidebarBtn = document.getElementById('open-sidebar-btn');
  const treeLabels = document.querySelectorAll('.tree-label');
  const navItems = document.querySelectorAll('.nav-item');
  
  const iframeView = document.getElementById('iframe-view');
  const markdownView = document.getElementById('markdown-view');
  const welcomeScreen = document.getElementById('welcome-screen');
  const activeTitle = document.getElementById('active-title');
  const currentCategory = document.getElementById('current-category');

  // 1. Sidebar Toggle Logic
  function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
    
    // Mobile responsive class
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle('active');
      sidebarOverlay.classList.toggle('active');
    }
  }

  function closeSidebarMobile() {
    if (window.innerWidth <= 768) {
      sidebar.classList.remove('active');
      sidebar.classList.add('collapsed');
      sidebarOverlay.classList.remove('active');
    }
  }

  if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', toggleSidebar);
  if (openSidebarBtn) openSidebarBtn.addEventListener('click', toggleSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebarMobile);

  // Close sidebar on mobile when resizing back to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      sidebarOverlay.classList.remove('active');
      if (sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
      }
    }
  });

  // 2. Collapsible Tree Menu Logic
  treeLabels.forEach(label => {
    label.addEventListener('click', (e) => {
      // Toggle expanded class on parent tree-node
      const parentNode = label.parentElement;
      parentNode.classList.toggle('expanded');
      
      // Calculate dynamic max-height for smooth transition
      const childrenContainer = parentNode.querySelector('.tree-children');
      if (parentNode.classList.contains('expanded')) {
        childrenContainer.style.maxHeight = childrenContainer.scrollHeight + 'px';
      } else {
        childrenContainer.style.maxHeight = '0px';
      }
    });
    
    // Initially expand if it has active items inside
    const parentNode = label.parentElement;
    if (parentNode.querySelector('.nav-item.active')) {
      parentNode.classList.add('expanded');
      const childrenContainer = parentNode.querySelector('.tree-children');
      childrenContainer.style.maxHeight = childrenContainer.scrollHeight + 'px';
    }
  });

  // 3. Router Logic (Hash-based)
  async function handleRouting() {
    const hash = window.location.hash || '#home';
    const targetPath = hash.substring(1); // Remove '#'

    // Reset views
    iframeView.classList.remove('active');
    markdownView.classList.remove('active');
    welcomeScreen.style.display = 'none';
    
    // Set active class on menu items
    navItems.forEach(item => {
      if (item.getAttribute('href') === hash) {
        item.classList.add('active');
        
        // Update Topbar Title Info
        const labelText = item.querySelector('.label-text')?.textContent || '';
        activeTitle.textContent = labelText;
        
        // Find category name
        const parentCategory = item.closest('.tree-node')?.querySelector('.tree-label span:not(.arrow-icon)')?.textContent;
        if (parentCategory) {
          currentCategory.textContent = parentCategory + ' / ';
        } else {
          currentCategory.textContent = '';
        }

        // Auto-expand parent category if not expanded
        const parentNode = item.closest('.tree-node');
        if (parentNode && !parentNode.classList.contains('expanded')) {
          parentNode.classList.add('expanded');
          const childrenContainer = parentNode.querySelector('.tree-children');
          childrenContainer.style.maxHeight = childrenContainer.scrollHeight + 'px';
        }
      } else {
        item.classList.remove('active');
      }
    });

    closeSidebarMobile();

    // Route matching
    if (targetPath === 'home' || targetPath === '') {
      welcomeScreen.style.display = 'flex';
      currentCategory.textContent = '';
      activeTitle.textContent = 'Welcome';
    } else if (targetPath.endsWith('.md')) {
      // Render Markdown via marked.js
      markdownView.classList.add('active');
      markdownView.innerHTML = '<div class="markdown-body"><p style="color: var(--text-muted);">Loading content...</p></div>';
      try {
        const response = await fetch(targetPath);
        if (!response.ok) throw new Error('File not found');
        const text = await response.text();
        
        // Strip Jekyll Front Matter if present
        let cleanedText = text;
        if (text.startsWith('---')) {
          const secondYamlBoundary = text.indexOf('---', 3);
          if (secondYamlBoundary !== -1) {
            cleanedText = text.substring(secondYamlBoundary + 3).trim();
          }
        }
        
        // Check if marked library is available
        if (window.marked && window.marked.parse) {
          markdownView.innerHTML = `<div class="markdown-body">${window.marked.parse(cleanedText)}</div>`;
        } else {
          markdownView.innerHTML = `<div class="markdown-body"><pre>${cleanedText}</pre></div>`;
        }
      } catch (err) {
        markdownView.innerHTML = `<div class="markdown-body"><p style="color: #ef4444;">Failed to load page: ${err.message}</p></div>`;
      }
    } else if (targetPath.endsWith('.html')) {
      // Render inside iframe
      iframeView.classList.add('active');
      iframeView.src = targetPath;
    } else {
      // Fallback
      welcomeScreen.style.display = 'flex';
    }
  }

  // Listen to hash changes
  window.addEventListener('hashchange', handleRouting);
  
  // Initial route handling
  if (!window.location.hash || window.location.hash === '#') {
    window.location.hash = '#home';
  } else {
    handleRouting();
  }
});
