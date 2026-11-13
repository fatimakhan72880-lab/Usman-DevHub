export interface CloudDeploymentWorkflowPhase {
  step: string;
  timeline: string;
  title: string;
  description: string;
  deliverables: string[];
}

export interface CloudDeploymentTechnicalFeature {
  title: string;
  description: string;
  category: 'Infrastructure & Compute' | 'Networking & CDN' | 'Security & Compliance' | 'Automation & Monitoring' | 'Handover & SLA';
}

export interface CloudDeploymentTypeInfo {
  id: string;
  name: string;
  tagline: string;
  badge?: string;
  categoryPill?: string;
  whatIsIt: string;
  whatClientGets: string[];
  deliverableFormats: string[];
  bestFor: string;
  estimatedDelivery: string;
  heroImage: string;
  sampleHighlights: { title: string; desc: string }[];
  workflowPhases?: CloudDeploymentWorkflowPhase[];
  technicalFeatures?: CloudDeploymentTechnicalFeature[];
  toolsUsed?: string[];
}

export const CLOUD_DEPLOYMENT_TYPES_DATA: CloudDeploymentTypeInfo[] = [
  {
    id: 'frontend-web-deployment',
    name: 'Frontend & Web App Deployment',
    tagline: 'Zero-downtime, global edge deployment for any frontend app, single-page application, or static website with custom domain and free lifetime SSL.',
    badge: 'Any Frontend Stack',
    categoryPill: 'Edge Deployment',
    whatIsIt: 'Instant, global edge deployment on top cloud platforms (Vercel, Cloudflare Pages, Netlify). Supports any frontend technology, framework, or static build with sub-second speeds, automatic Git previews, and custom domain linking.',
    whatClientGets: [
      'Production deployment on Vercel, Netlify, or Cloudflare Pages',
      'Custom Domain Connection (Namecheap, GoDaddy, Hostinger, etc.)',
      'Free Lifetime Auto-Renewing SSL / HTTPS Certificate',
      'Global Edge CDN Caching & Brotli Compression',
      'Production Environment Variables Setup (.env.production)',
      'Automated Git Pull Request Preview Deployments',
      'Single-Page Application (SPA) Fallbacks & 404 Routing',
      'Speed & Performance Optimization (Lighthouse 90+ Score)'
    ],
    deliverableFormats: [
      'Live Production URL & Custom Domain Link',
      'Hosting Dashboard Access / Project Transfer',
      'Environment Configuration Documentation',
      'Global DNS Propagation Verification Report'
    ],
    bestFor: 'Any web application, portfolio, landing page, corporate website, or client web project regardless of frontend tech stack.',
    estimatedDelivery: 'Decided Upon Discussion',
    heroImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    sampleHighlights: [
      { title: 'Global Edge Network', desc: 'Pages served from 300+ worldwide edge locations in <50ms' },
      { title: 'Git Push Deployment', desc: 'Code automatically deploys to live whenever you push to main' },
      { title: 'Instant Rollbacks', desc: 'Roll back to any previous deployment in 1 single click' }
    ],
    workflowPhases: [
      {
        step: '01',
        timeline: 'Phase 1',
        title: 'Repository & Build Audit',
        description: 'We audit your package scripts and build settings to guarantee zero build errors and optimized output.',
        deliverables: ['Build audit check', 'Environment variable checklist']
      },
      {
        step: '02',
        timeline: 'Phase 2',
        title: 'Edge Hosting Provisioning',
        description: 'Connecting Git repository (GitHub/GitLab) with cloud edge hosting provider.',
        deliverables: ['Live preview URL', 'Production branch tracking']
      },
      {
        step: '03',
        timeline: 'Phase 3',
        title: 'Domain, SSL & Edge Caching',
        description: 'Configuring DNS A / CNAME records, activating auto-renewing SSL certificate, and testing global propagation.',
        deliverables: ['Live custom domain with SSL', 'Global DNS verification', 'Credential handover']
      }
    ],
    technicalFeatures: [
      { title: 'Edge CDN Caching', description: 'Zero-latency cached static assets served closest to the user.', category: 'Networking & CDN' },
      { title: 'Automated HTTPS', description: 'HSTS preloaded, TLS 1.3 protocol with automatic certificate renewals.', category: 'Security & Compliance' },
      { title: 'Edge Middleware', description: 'Supports geolocation redirects, basic authentication, and custom edge headers.', category: 'Infrastructure & Compute' },
      { title: 'Git Branch Previews', description: 'Every pull request gets an isolated preview URL before merging.', category: 'Automation & Monitoring' }
    ],
    toolsUsed: ['Any Frontend Stack', 'Cloudflare Pages', 'Vercel', 'Netlify', 'GitHub / GitLab', 'Custom Domains']
  },
  {
    id: 'vps-docker-server-setup',
    name: 'Linux VPS & Docker Server Setup',
    tagline: 'Hardened Ubuntu VPS server setup with Docker containerization, Nginx reverse proxy, any database, and automated daily backups.',
    badge: 'Any Language & Stack',
    categoryPill: 'Cloud VPS & Docker',
    whatIsIt: 'Full-stack cloud server setup on any cloud provider (DigitalOcean, Hetzner, AWS EC2, Linode, etc.). We containerize applications written in any programming language, configure Nginx reverse proxy with SSL, set up your database, and lock down server firewalls.',
    whatClientGets: [
      'Fresh Ubuntu Linux Server Provisioning & Hardening',
      'Docker & Docker Compose Containerization for any language/framework',
      'Nginx Reverse Proxy with Gzip compression and WebSocket support',
      'Let’s Encrypt Wildcard / Single SSL with automated Certbot renewal',
      'Database Setup (PostgreSQL / MySQL / MongoDB / Redis / etc.)',
      'Automated Daily Database Backups (Local / Remote Cloud Storage)',
      'UFW Firewall Configuration & SSH Key-Only Authentication (Disabling Root Password)',
      'Process Management with Docker restart policies or PM2'
    ],
    deliverableFormats: [
      'Hardened Linux VPS Server with Root / Sudo Access',
      'docker-compose.yml and Nginx config files',
      'Encrypted Credentials Handover Sheet (SSH keys, DB credentials)',
      'Daily Backup Script & Restoration Guide'
    ],
    bestFor: 'Any modern programming language or backend (Node.js, TypeScript, Python, Go, Rust, Java, Dockerized apps) needing dedicated high-performance server compute.',
    estimatedDelivery: 'Decided Upon Discussion',
    heroImage: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
    sampleHighlights: [
      { title: 'Container Isolation', desc: 'Any tech stack runs isolated in lightweight Docker containers with zero dependency conflicts' },
      { title: 'Security Lockdown', desc: 'Brute-force protection, UFW firewall, fail2ban, and SSH keys' },
      { title: 'Automated DB Backups', desc: 'Never lose customer data with daily cron backup snapshots' }
    ],
    workflowPhases: [
      {
        step: '01',
        timeline: 'Phase 1',
        title: 'VPS Provisioning & Security Hardening',
        description: 'Creating Ubuntu server instance, non-root sudo user, disabling password SSH, and configuring UFW firewall.',
        deliverables: ['Hardened server', 'Secure SSH keypair authentication']
      },
      {
        step: '02',
        timeline: 'Phase 2',
        title: 'Docker & Database Configuration',
        description: 'Setting up Docker runtime for your application, running database containers, and applying persistent data volumes.',
        deliverables: ['Active database instance', 'Persistent volume mounts', 'Automated backup script']
      },
      {
        step: '03',
        timeline: 'Phase 3',
        title: 'Nginx, Domain SSL & App Launch',
        description: 'Configuring Nginx reverse proxy, obtaining Certbot SSL certificate, and deploying the client application live.',
        deliverables: ['Live domain with HTTPS', 'Nginx reverse proxy', 'Encrypted credential vault']
      }
    ],
    technicalFeatures: [
      { title: 'Nginx Reverse Proxy', description: 'High-throughput reverse proxy routing HTTP/WebSocket traffic to internal Docker ports.', category: 'Networking & CDN' },
      { title: 'SSH Hardening & UFW', description: 'Only ports 80, 443, and custom SSH port open; root password login disabled.', category: 'Security & Compliance' },
      { title: 'Docker Architecture', description: 'Universal containerization for any language, framework, or dependency.', category: 'Infrastructure & Compute' },
      { title: 'Automated Backups', description: 'Cron job dumps database snapshots daily with automatic rolling retention rotation.', category: 'Automation & Monitoring' }
    ],
    toolsUsed: ['Any Language (Docker)', 'Ubuntu Linux', 'Nginx', 'PostgreSQL / MySQL / MongoDB', 'DigitalOcean', 'Hetzner', 'AWS EC2']
  },
  {
    id: 'domain-dns-cloudflare-security',
    name: 'Domain, DNS & Cloudflare Security',
    tagline: 'Professional domain routing, SSL error fixes, Cloudflare WAF, and business email DNS authentication (SPF, DKIM, DMARC) for any website.',
    badge: 'Universal Support',
    categoryPill: 'DNS & Email Deliverability',
    whatIsIt: 'End-to-end domain setup and security hardening for any website, web app, or server host. We connect your domain, eliminate "Not Secure" browser warnings, protect against attacks via Cloudflare, and ensure your business emails land in client inboxes.',
    whatClientGets: [
      'Domain Linking to Any Server or Cloud Host (Namecheap, GoDaddy, Hostinger, AWS, Vercel, etc.)',
      'Cloudflare Nameservers Setup with global proxy and fast DNS propagation',
      'Lifetime Free SSL / HTTPS Setup & Fixing "Not Secure" Warnings',
      'Business Email DNS Authentication (SPF, DKIM, DMARC) for Google Workspace / Zoho / Microsoft 365',
      'Canonical URL Redirection (Force www or non-www, force HTTPS)',
      'Cloudflare Web Application Firewall (WAF) & Bot Fight Mode',
      'DDoS Protection & Rate Limiting against malicious traffic',
      'DNSSEC Setup to prevent DNS spoofing and cache poisoning'
    ],
    deliverableFormats: [
      'Configured & Protected Cloudflare Dashboard',
      'Verified DNS Records (A, CNAME, MX, TXT, SPF, DKIM, DMARC)',
      '10/10 Email Deliverability Test Score Report',
      'SSL Certificate Verification Badge'
    ],
    bestFor: 'Any business owner or website facing email deliverability issues, SSL warnings, slow DNS, or domain transfer needs.',
    estimatedDelivery: 'Decided Upon Discussion',
    heroImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
    sampleHighlights: [
      { title: 'Inbox Deliverability', desc: '100% compliant SPF, DKIM & DMARC prevents emails going to spam' },
      { title: 'DDoS Shield', desc: 'Cloudflare enterprise network absorbs automated bot attacks' },
      { title: 'Instant DNS Updates', desc: 'DNS propagation in under 5 minutes with Cloudflare 1.1.1.1' }
    ],
    workflowPhases: [
      {
        step: '01',
        timeline: 'Phase 1',
        title: 'DNS & Nameserver Migration',
        description: 'Connecting domain registrar to Cloudflare DNS and importing existing DNS records with zero downtime.',
        deliverables: ['Cloudflare integration', 'Zero-downtime DNS cutover']
      },
      {
        step: '02',
        timeline: 'Phase 2',
        title: 'SSL / HTTPS & WAF Hardening',
        description: 'Enforcing Full (Strict) SSL encryption, HTTP/3, and enabling Cloudflare Bot Fight Mode.',
        deliverables: ['A+ SSL Labs score', 'Canonical redirect rules']
      },
      {
        step: '03',
        timeline: 'Phase 3',
        title: 'Email Security (SPF, DKIM, DMARC) Verification',
        description: 'Setting up cryptographic email signatures and running inbox delivery tests.',
        deliverables: ['10/10 Mail-Tester score', 'DMARC policy enforcement']
      }
    ],
    technicalFeatures: [
      { title: 'SPF, DKIM & DMARC', description: 'Cryptographic email authentication headers preventing sender spoofing.', category: 'Security & Compliance' },
      { title: 'Cloudflare Edge CDN', description: 'Global caching reducing server load and accelerating response times.', category: 'Networking & CDN' },
      { title: 'WAF & Bot Management', description: 'Layer 7 attack mitigation and automated scraper challenges.', category: 'Security & Compliance' },
      { title: 'DNSSEC Cryptography', description: 'Digitally signed DNS lookups preventing DNS hijacking.', category: 'Networking & CDN' }
    ],
    toolsUsed: ['Cloudflare', 'Any Domain Registrar', 'Any Business Email', 'Let’s Encrypt', 'DNSSEC']
  },
  {
    id: 'cicd-github-actions-pipeline',
    name: 'Automated CI/CD & GitHub Actions',
    tagline: 'Automated build, test, and zero-downtime deployment pipelines for any codebase or technology stack on every Git push.',
    badge: 'Universal Automation',
    categoryPill: 'Continuous Integration & Delivery',
    whatIsIt: 'Automated DevOps workflow using GitHub Actions or GitLab CI. Works with any programming language: when you or your team push code, the pipeline automatically runs tests, builds containers, and deploys to your live production server without manual SSH or FTP uploads.',
    whatClientGets: [
      'Custom CI/CD YAML Pipeline Scripts tailored to your tech stack',
      'Automated Build & Linting on every Git push / pull request',
      'Secure SSH Deployment to VPS via Encrypted GitHub Secrets',
      'Zero-Downtime Rolling Restarts (No 502 Bad Gateway errors)',
      'Automated Container Build & Push to Docker Hub or GitHub Packages',
      'Slack / Discord / Telegram Deployment Notification Webhooks',
      '1-Click Instant Version Rollback if a bug is introduced',
      'Branch Protection Rules & Deployment Approvals Setup'
    ],
    deliverableFormats: [
      '.github/workflows/deploy.yml production script',
      'Repository Secret configuration guide',
      'Tested & Green Pipeline Run Demonstration',
      'Developer Deployment & Rollback Cheat Sheet'
    ],
    bestFor: 'Any development team, business owner, or software project wanting to eliminate manual deployments across any programming language.',
    estimatedDelivery: 'Decided Upon Discussion',
    heroImage: 'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?auto=format&fit=crop&w=1200&q=80',
    sampleHighlights: [
      { title: 'Hands-Free Deployment', desc: 'Push code to main branch and your live site updates automatically in 60s' },
      { title: 'Zero Downtime', desc: 'New containers boot up and healthcheck passes before old ones are stopped' },
      { title: 'Rollback Safety', desc: 'Instant 1-click rollback to prior stable commit anytime' }
    ],
    workflowPhases: [
      {
        step: '01',
        timeline: 'Phase 1',
        title: 'Build & Test Script Optimization',
        description: 'Writing reproducible build steps and dependency caching for fast 60-second pipeline execution.',
        deliverables: ['Build configuration', 'Dependency caching strategy']
      },
      {
        step: '02',
        timeline: 'Phase 2',
        title: 'Secure Remote Deployment Workflow',
        description: 'Configuring encrypted GitHub Secrets (SSH keys, server IPs, environment tokens) and automated deployment triggers.',
        deliverables: ['.github/workflows/deploy.yml', 'Encrypted GitHub secrets']
      },
      {
        step: '03',
        timeline: 'Phase 3',
        title: 'Healthchecks & Alert Notifications',
        description: 'Adding curl healthcheck verification and instant deployment notifications on Slack or Telegram.',
        deliverables: ['Live verified green pipeline', 'Rollback verification', 'Developer handover guide']
      }
    ],
    technicalFeatures: [
      { title: 'GitHub Actions Matrix', description: 'Parallelized build steps with multi-job caching for ultra-fast CI runs.', category: 'Automation & Monitoring' },
      { title: 'Zero-Downtime Rollouts', description: 'Atomic symlink or Docker health-checked replacement with zero user interruption.', category: 'Infrastructure & Compute' },
      { title: 'Encrypted Secrets Management', description: 'Zero plaintext credentials stored in code repositories.', category: 'Security & Compliance' },
      { title: 'Real-Time Status Alerts', description: 'Instant webhook alerts on build failure or successful release.', category: 'Automation & Monitoring' }
    ],
    toolsUsed: ['GitHub Actions', 'GitLab CI', 'Docker (Any Language)', 'SSH & Rsync', 'Bash Scripting', 'Slack / Discord Webhooks']
  }
];
