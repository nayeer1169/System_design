/* ==========================================================================
   Global Site Theme Toggle
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  
  // Set default theme from localStorage or system preference
  const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', savedTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });
  
  // Initialize all controllers
  initPPTDeck();
  initLoadBalancer();
  initCachingDemo();
  initDBWizard();
});

/* ==========================================================================
   Interactive PPT Presentation Deck Controller
   ========================================================================== */
function initPPTDeck() {
  const slides = document.querySelectorAll('.ppt-viewport .slide');
  const dots = document.querySelectorAll('.ppt-dot');
  const prevBtn = document.getElementById('ppt-prev-btn');
  const nextBtn = document.getElementById('ppt-next-btn');
  const autoplayBtn = document.getElementById('ppt-autoplay-btn');
  const autoplayText = document.getElementById('autoplay-text');
  const progressFill = document.getElementById('ppt-progress-fill');
  const slideNumLabel = document.getElementById('ppt-slide-num-label');

  let currentIdx = 0;
  let isAutoplay = false;
  let progressTimer = null;
  const slideDuration = 8000; // 8 seconds per slide
  let elapsed = 0;

  function showSlide(index) {
    // Wrap around boundaries
    if (index >= slides.length) index = 0;
    if (index < 0) index = slides.length - 1;

    currentIdx = index;

    // Toggle slide active classes
    slides.forEach((slide, idx) => {
      slide.classList.toggle('active-slide', idx === currentIdx);
    });

    // Toggle dot active classes
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active-dot', idx === currentIdx);
    });

    // Update labels
    slideNumLabel.textContent = `Slide ${currentIdx + 1} / ${slides.length}`;

    // Reset progress tracking
    elapsed = 0;
    progressFill.style.width = '0%';
  }

  function nextSlide() {
    showSlide(currentIdx + 1);
  }

  function prevSlide() {
    showSlide(currentIdx - 1);
  }

  function startAutoplay() {
    isAutoplay = true;
    autoplayText.textContent = "Pause Autoplay";
    autoplayBtn.querySelector('.autoplay-play-icon').classList.add('hidden');
    autoplayBtn.querySelector('.autoplay-pause-icon').classList.remove('hidden');

    elapsed = 0;
    
    // Smooth progress bar update (every 100ms)
    progressTimer = setInterval(() => {
      elapsed += 100;
      const pct = Math.min((elapsed / slideDuration) * 100, 100);
      progressFill.style.width = `${pct}%`;
      
      if (elapsed >= slideDuration) {
        nextSlide();
      }
    }, 100);
  }

  function stopAutoplay() {
    isAutoplay = false;
    autoplayText.textContent = "Autoplay";
    autoplayBtn.querySelector('.autoplay-play-icon').classList.remove('hidden');
    autoplayBtn.querySelector('.autoplay-pause-icon').classList.add('hidden');
    
    clearInterval(progressTimer);
    progressFill.style.width = '0%';
  }

  function toggleAutoplay() {
    if (isAutoplay) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  }

  // Event Listeners
  nextBtn.addEventListener('click', () => {
    stopAutoplay();
    nextSlide();
  });

  prevBtn.addEventListener('click', () => {
    stopAutoplay();
    prevSlide();
  });

  autoplayBtn.addEventListener('click', () => {
    toggleAutoplay();
  });

  // Dots navigation
  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      stopAutoplay();
      showSlide(idx);
    });
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    // Don't intercept typing in forms or text fields
    const activeElem = document.activeElement;
    if (activeElem && (activeElem.tagName === 'INPUT' || activeElem.tagName === 'TEXTAREA' || activeElem.isContentEditable)) {
      return;
    }

    if (e.key === 'ArrowRight') {
      stopAutoplay();
      nextSlide();
    } else if (e.key === 'ArrowLeft') {
      stopAutoplay();
      prevSlide();
    }
  });

  // Init default slide position
  showSlide(0);
}

/* ==========================================================================
   Load Balancer Playground Controller
   ========================================================================== */
function initLoadBalancer() {
  const btnSend = document.getElementById('btn-send-req');
  const chkFailSrv3 = document.getElementById('srv-fail-3');
  const canvas = document.getElementById('lb-canvas-container');
  const clientNode = document.getElementById('node-client');
  const lbNode = document.getElementById('node-lb');
  
  let rrIndex = 0;
  const servers = [
    { id: 1, elem: document.getElementById('srv-1'), countElem: document.getElementById('srv-count-1'), count: 0 },
    { id: 2, elem: document.getElementById('srv-2'), countElem: document.getElementById('srv-count-2'), count: 0 },
    { id: 3, elem: document.getElementById('srv-3'), countElem: document.getElementById('srv-count-3'), count: 0 }
  ];

  // Set default sticky client IP configuration
  let activeClientIp = "192.168.1.10";
  document.querySelectorAll('.client-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.client-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      activeClientIp = e.currentTarget.getAttribute('data-client-ip');
    });
  });

  // Monitor toggle fault state
  chkFailSrv3.addEventListener('change', (e) => {
    const isOffline = e.currentTarget.checked;
    servers[2].elem.classList.toggle('offline', isOffline);
  });

  btnSend.addEventListener('click', () => {
    btnSend.disabled = true;
    
    // Choose LB Algorithm
    const alg = document.querySelector('input[name="lb-algorithm"]:checked').value;
    let targetServer = null;

    // Filter active/healthy nodes
    const healthyServers = servers.filter(s => {
      if (s.id === 3 && chkFailSrv3.checked) return false;
      return true;
    });

    if (healthyServers.length === 0) {
      // Fail fast: All nodes down!
      animatePacket(clientNode, lbNode, false, () => {
        // Flash LB red
        lbNode.style.borderColor = 'var(--accent-danger)';
        setTimeout(() => lbNode.style.borderColor = 'var(--accent-primary)', 500);
        btnSend.disabled = false;
      });
      return;
    }

    if (alg === 'roundrobin') {
      // Round Robin algorithm
      targetServer = healthyServers[rrIndex % healthyServers.length];
      rrIndex = (rrIndex + 1) % healthyServers.length;
    } else {
      // IP Hash algorithm (Sticky mappings)
      // Deterministically map IP to healthy server index
      let hash = 0;
      for (let i = 0; i < activeClientIp.length; i++) {
        hash += activeClientIp.charCodeAt(i);
      }
      const srvIndex = hash % healthyServers.length;
      targetServer = healthyServers[srvIndex];
    }

    // Run Packet Animation
    animatePacket(clientNode, lbNode, true, () => {
      animatePacket(lbNode, targetServer.elem, true, () => {
        // Increment server counter
        targetServer.count++;
        targetServer.countElem.textContent = targetServer.count;
        
        // Flash success
        targetServer.elem.style.transform = 'scale(1.05)';
        setTimeout(() => {
          targetServer.elem.style.transform = 'scale(1)';
          btnSend.disabled = false;
        }, 300);
      });
    });
  });

  // Floating dot physics animator
  function animatePacket(fromElem, toElem, success, onComplete) {
    const dot = document.createElement('div');
    dot.className = 'packet-dot';
    
    const rectFrom = fromElem.getBoundingClientRect();
    const rectTo = toElem.getBoundingClientRect();
    const rectCanvas = canvas.getBoundingClientRect();

    // Coordinates relative to canvas
    const xStart = rectFrom.left + rectFrom.width / 2 - rectCanvas.left;
    const yStart = rectFrom.top + rectFrom.height / 2 - rectCanvas.top;
    const xEnd = rectTo.left + rectTo.width / 2 - rectCanvas.left;
    const yEnd = rectTo.top + rectTo.height / 2 - rectCanvas.top;

    dot.style.left = `${xStart}px`;
    dot.style.top = `${yStart}px`;
    canvas.appendChild(dot);

    // Trigger hardware accelerated animation
    dot.animate([
      { left: `${xStart}px`, top: `${yStart}px`, opacity: 1 },
      { left: `${xEnd}px`, top: `${yEnd}px`, opacity: 1 }
    ], {
      duration: 500,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }).onfinish = () => {
      dot.remove();
      if (onComplete) onComplete();
    };
  }
}

/* ==========================================================================
   Caching & Redis Latency Simulation
   ========================================================================== */
function initCachingDemo() {
  const btnFetch = document.getElementById('btn-fetch-data');
  const chkCache = document.getElementById('cache-enable-switch');
  const latencyDisplay = document.getElementById('latency-value-display');
  const sourceBadge = document.getElementById('latency-source-badge');
  
  const dotCache = document.getElementById('dot-cache');
  const dotDb = document.getElementById('dot-db');
  
  const redisNode = document.getElementById('node-redis-cache');
  const postgresNode = document.getElementById('node-postgres-db');
  
  let queryCount = 0;

  btnFetch.addEventListener('click', () => {
    btnFetch.disabled = true;
    latencyDisplay.textContent = "...";
    sourceBadge.textContent = "Querying";
    sourceBadge.className = "latency-source badge-outline";
    
    const isCacheEnabled = chkCache.checked;
    queryCount++;

    if (isCacheEnabled) {
      // Determine Cache Hit vs Cache Miss
      // Let's implement: First query is ALWAYS a cache miss. Subsequent queries have an 80% Cache Hit rate.
      const isCacheHit = queryCount > 1 && Math.random() > 0.2;

      if (isCacheHit) {
        // Cache Hit Flow (~2ms response)
        animateFlowDot(dotCache, 400, () => {
          redisNode.classList.add('active-node');
          setTimeout(() => {
            redisNode.classList.remove('active-node');
            latencyDisplay.textContent = "2 ms";
            sourceBadge.textContent = "Cache Hit";
            sourceBadge.className = "latency-source cache-hit-style";
            btnFetch.disabled = false;
          }, 150);
        });
      } else {
        // Cache Miss Flow (~148ms response)
        // Checks cache first (fails), then queries PostgreSQL
        animateFlowDot(dotCache, 300, () => {
          redisNode.classList.add('active-node');
          
          setTimeout(() => {
            redisNode.classList.remove('active-node');
            
            // Redirect down to Database pipeline
            animateFlowDot(dotDb, 500, () => {
              postgresNode.classList.add('active-node');
              
              setTimeout(() => {
                postgresNode.classList.remove('active-node');
                latencyDisplay.textContent = "148 ms";
                sourceBadge.textContent = "Cache Miss";
                sourceBadge.className = "latency-source cache-miss-style";
                
                // Write back to Cache visual effect
                writeBackToCache(() => {
                  btnFetch.disabled = false;
                });
              }, 150);
            });
            
          }, 300);
        });
      }

    } else {
      // Cache Disabled: Query SQL Database directly (~152ms)
      animateFlowDot(dotDb, 800, () => {
        postgresNode.classList.add('active-node');
        setTimeout(() => {
          postgresNode.classList.remove('active-node');
          latencyDisplay.textContent = "152 ms";
          sourceBadge.textContent = "Database Read";
          sourceBadge.className = "latency-source badge-outline";
          btnFetch.disabled = false;
        }, 150);
      });
    }
  });

  // Animates the inline progress dot along pipeline
  function animateFlowDot(dotElem, duration, onComplete) {
    dotElem.style.opacity = '1';
    dotElem.animate([
      { left: '0%' },
      { left: '100%' }
    ], {
      duration: duration,
      easing: 'linear'
    }).onfinish = () => {
      dotElem.style.opacity = '0';
      if (onComplete) onComplete();
    };
  }

  // Reverse animation showing data populate back into Redis
  function writeBackToCache(onComplete) {
    const dot = document.createElement('div');
    dot.className = 'packet-dot';
    dot.style.backgroundColor = 'var(--accent-success)';
    dot.style.boxShadow = '0 0 10px var(--accent-success)';
    
    const rectDB = postgresNode.getBoundingClientRect();
    const rectRedis = redisNode.getBoundingClientRect();
    const container = document.querySelector('.cache-viz-area').getBoundingClientRect();

    const xStart = rectDB.left + rectDB.width / 2 - container.left;
    const yStart = rectDB.top + rectDB.height / 2 - container.top;
    const xEnd = rectRedis.left + rectRedis.width / 2 - container.left;
    const yEnd = rectRedis.top + rectRedis.height / 2 - container.top;

    dot.style.left = `${xStart}px`;
    dot.style.top = `${yStart}px`;
    document.querySelector('.cache-viz-area').appendChild(dot);

    dot.animate([
      { left: `${xStart}px`, top: `${yStart}px` },
      { left: `${xEnd}px`, top: `${yEnd}px` }
    ], {
      duration: 400,
      easing: 'ease-out'
    }).onfinish = () => {
      dot.remove();
      redisNode.classList.add('active-node');
      setTimeout(() => {
        redisNode.classList.remove('active-node');
        if (onComplete) onComplete();
      }, 200);
    };
  }
}

/* ==========================================================================
   Database Paradigm Recommendation Wizard
   ========================================================================== */
function initDBWizard() {
  const wizardForm = document.getElementById('db-wizard-form');
  const steps = document.querySelectorAll('.wizard-step');
  const btnPrev = document.getElementById('btn-wizard-prev');
  const btnNext = document.getElementById('btn-wizard-next');
  const btnSubmit = document.getElementById('btn-wizard-submit');
  const resultPane = document.getElementById('wizard-result-pane');
  const btnReset = document.getElementById('btn-wizard-reset');
  
  let currentStepIdx = 0;

  function showStep(index) {
    steps.forEach((step, idx) => {
      step.classList.toggle('active-step', idx === index);
    });
    
    currentStepIdx = index;

    // Controls display updates
    btnPrev.classList.toggle('hidden', index === 0);
    
    if (index === steps.length - 1) {
      btnNext.classList.add('hidden');
      btnSubmit.classList.remove('hidden');
    } else {
      btnNext.classList.remove('hidden');
      btnSubmit.classList.add('hidden');
    }
  }

  btnNext.addEventListener('click', () => {
    if (currentStepIdx < steps.length - 1) {
      showStep(currentStepIdx + 1);
    }
  });

  btnPrev.addEventListener('click', () => {
    if (currentStepIdx > 0) {
      showStep(currentStepIdx - 1);
    }
  });

  wizardForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Read selected inputs
    const q1 = document.querySelector('input[name="db-q1"]:checked').value;
    const q2 = document.querySelector('input[name="db-q2"]:checked').value;
    const q3 = document.querySelector('input[name="db-q3"]:checked').value;
    
    wizardForm.classList.add('hidden');
    resultPane.classList.remove('hidden');

    calculateRecommendation(q1, q2, q3);
  });

  btnReset.addEventListener('click', () => {
    wizardForm.reset();
    resultPane.classList.add('hidden');
    wizardForm.classList.remove('hidden');
    showStep(0);
  });

  function calculateRecommendation(schema, scale, consistency) {
    const rIcon = document.getElementById('result-icon');
    const rTitle = document.getElementById('result-title');
    const rCategory = document.getElementById('result-category');
    const rCapType = document.getElementById('result-cap-type');
    const rSummary = document.getElementById('result-text-summary');

    if (schema === 'structured') {
      if (consistency === 'strict') {
        // Classic SQL Database
        rIcon.textContent = "🗄️";
        rTitle.textContent = "PostgreSQL / MySQL";
        rCategory.textContent = "Relational Database (SQL)";
        rCapType.textContent = "CA / CP (ACID Transactions)";
        rSummary.textContent = "Because your application requires complex joins, structured schemas, and strict transactional guarantees, a classic relational database is recommended. Read scalability is easily handled using replica followers.";
      } else {
        // Structured but loose consistency requirements (rare, but SQL replicas fits)
        rIcon.textContent = "🗄️";
        rTitle.textContent = "PostgreSQL (with Replication)";
        rCategory.textContent = "Relational Database (SQL)";
        rCapType.textContent = "CA (Consistency + Availability)";
        rSummary.textContent = "A relational database still fits your structured tables, but since eventual consistency is allowed, you can heavily scale reads using asynchronous follower replicas.";
      }
    } else {
      // Unstructured schemas
      if (scale === 'massive') {
        if (consistency === 'strict') {
          // Document store with ACID options or distributed SQL
          rIcon.textContent = "🍃";
          rTitle.textContent = "MongoDB (Document)";
          rCategory.textContent = "NoSQL Document Store";
          rCapType.textContent = "CP (Consistency + Partition Tolerance)";
          rSummary.textContent = "Since your schema is flexible and you have massive traffic, MongoDB is ideal. It supports dynamic nested JSON documents while guaranteeing strong consistency for single-document transactions.";
        } else {
          // High write throughput, eventual consistency
          rIcon.textContent = "👁️";
          rTitle.textContent = "Apache Cassandra";
          rCategory.textContent = "NoSQL Column-Family Store";
          rCapType.textContent = "AP (Availability + Partition Tolerance)";
          rSummary.textContent = "Your requirements point to high write throughput and eventual consistency. Cassandra's decentralized leaderless architecture scales writes horizontally without bottleneck, making it perfect for logs and message streams.";
        }
      } else {
        // Low-medium scale, unstructured schema
        if (consistency === 'strict') {
          rIcon.textContent = "🍃";
          rTitle.textContent = "MongoDB (Document)";
          rCategory.textContent = "NoSQL Document Store";
          rCapType.textContent = "CP (Consistency + Partition Tolerance)";
          rSummary.textContent = "Since you require document flexibility and strict data consistency, MongoDB is the most popular, standard choice for developer productivity.";
        } else {
          rIcon.textContent = "🔑";
          rTitle.textContent = "DynamoDB / Redis";
          rCategory.textContent = "NoSQL Key-Value Store";
          rCapType.textContent = "AP (Availability + Partition Tolerance)";
          rSummary.textContent = "Because you have simple key-value lookups with loose consistency needs, a fully managed NoSQL system like AWS DynamoDB or Redis will provide sub-millisecond speeds with zero ops overhead.";
        }
      }
    }
  }
}
