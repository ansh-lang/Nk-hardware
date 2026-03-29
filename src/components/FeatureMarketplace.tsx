import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, CheckCircle2, Star, Zap, Shield, TrendingUp, Users, ShoppingCart, 
  MessageSquare, Layout, Settings, Database, Globe, Smartphone, Mail, Bell, Calendar, 
  FileText, Image as ImageIcon, Video, Map, CreditCard, Lock, Key, Cpu, Server, Wifi, 
  Mic, Route, Truck, Boxes, Scan, Edit3, Eye, Trophy, Ticket, BookOpen, HelpCircle, 
  Award, Briefcase, Clock, DollarSign, LayoutDashboard, BarChart2, MessageCircle, 
  Inbox, Phone, Bot, Smile, Wrench, Home, Link, Bitcoin, Image, Box, Layers, PieChart, 
  Activity, AlertTriangle, Filter, MousePointer, AlertOctagon, Crosshair, Webhook, Loader2,
  RefreshCw, RotateCcw, Gift, Share2, Leaf, Repeat, Wind, Music, UserCheck, TrendingDown, 
  Cloud, MapPin, ArrowRightLeft, Plane, Trash2, BarChart, Handshake, Calculator, Percent, 
  Package, ArrowUpCircle, QrCode, Maximize, User, Footprints, Sparkles, Palette, Sofa, 
  Paintbrush, ListChecks, Utensils, AlertCircle, Thermometer, Trash, Store, Crown, 
  UserPlus, Scissors, ShieldCheck, Megaphone, SearchCode, Gavel, FileSearch, Building, 
  HardHat, PenTool, Archive, Timer, Rocket, Lightbulb, Play, ShieldAlert, Camera, Brain, 
  Mic2, MessageSquarePlus, Send, Languages, Globe2, Ruler, Monitor
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { logAction } from '../lib/audit';

const features = [
  { id: 'f1', name: 'Advanced Analytics Dashboard', category: 'Analytics', icon: TrendingUp, description: 'Deep dive into your data with customizable charts and reports.' },
  { id: 'f2', name: 'AI Sales Predictor', category: 'AI', icon: Zap, description: 'Predict future sales trends using machine learning algorithms.' },
  { id: 'f3', name: 'Multi-Channel CRM', category: 'CRM', icon: Users, description: 'Manage customer relationships across email, social, and phone.' },
  { id: 'f4', name: 'Automated Email Sequences', category: 'Marketing', icon: Mail, description: 'Set up drip campaigns and automated follow-ups.' },
  { id: 'f5', name: 'Inventory Forecasting', category: 'Inventory', icon: Database, description: 'Predict when you will run out of stock and automate reordering.' },
  { id: 'f6', name: 'Dynamic Pricing Engine', category: 'Sales', icon: ShoppingCart, description: 'Automatically adjust prices based on demand and competitor pricing.' },
  { id: 'f7', name: 'Customer Segmentation', category: 'CRM', icon: Users, description: 'Group customers based on behavior, demographics, and purchase history.' },
  { id: 'f8', name: 'A/B Testing Module', category: 'Marketing', icon: Layout, description: 'Test different variations of your pages to optimize conversion rates.' },
  { id: 'f9', name: 'Live Chat Support', category: 'Support', icon: MessageSquare, description: 'Engage with visitors in real-time with a built-in chat widget.' },
  { id: 'f10', name: 'Helpdesk Ticketing System', category: 'Support', icon: FileText, description: 'Manage customer support requests efficiently.' },
  { id: 'f11', name: 'Knowledge Base Builder', category: 'Support', icon: FileText, description: 'Create a self-serve help center for your customers.' },
  { id: 'f12', name: 'Social Media Scheduler', category: 'Marketing', icon: Globe, description: 'Plan and publish posts to multiple social networks.' },
  { id: 'f13', name: 'Affiliate Marketing Manager', category: 'Marketing', icon: Users, description: 'Track and manage your affiliate partners and payouts.' },
  { id: 'f14', name: 'Loyalty Program Builder', category: 'Sales', icon: Star, description: 'Reward repeat customers with points and discounts.' },
  { id: 'f15', name: 'Subscription Management', category: 'Sales', icon: Calendar, description: 'Handle recurring billing and subscription plans.' },
  { id: 'f16', name: 'Multi-Currency Support', category: 'Finance', icon: Globe, description: 'Accept payments and display prices in multiple currencies.' },
  { id: 'f17', name: 'Tax Calculation Engine', category: 'Finance', icon: FileText, description: 'Automatically calculate taxes based on customer location.' },
  { id: 'f18', name: 'Fraud Detection System', category: 'Security', icon: Shield, description: 'Identify and block fraudulent transactions.' },
  { id: 'f19', name: 'Two-Factor Authentication (2FA)', category: 'Security', icon: Lock, description: 'Add an extra layer of security to admin accounts.' },
  { id: 'f20', name: 'Role-Based Access Control (RBAC)', category: 'Security', icon: Key, description: 'Define granular permissions for different staff members.' },
  { id: 'f21', name: 'Audit Logging & Compliance', category: 'Security', icon: FileText, description: 'Track all system changes for compliance and security.' },
  { id: 'f22', name: 'Data Export & Backup', category: 'System', icon: Database, description: 'Schedule automated backups and export data easily.' },
  { id: 'f23', name: 'API Rate Limiting', category: 'System', icon: Server, description: 'Protect your API from abuse with rate limiting.' },
  { id: 'f24', name: 'Webhooks Manager', category: 'System', icon: Webhook, description: 'Send real-time data to external services.' },
  { id: 'f25', name: 'Custom Domain Mapping', category: 'System', icon: Globe, description: 'Use your own domain name for the admin panel.' },
  { id: 'f26', name: 'White-Labeling Options', category: 'System', icon: Layout, description: 'Customize the look and feel to match your brand.' },
  { id: 'f27', name: 'Mobile App (iOS/Android)', category: 'Mobile', icon: Smartphone, description: 'Manage your business on the go with a native mobile app.' },
  { id: 'f28', name: 'Push Notifications', category: 'Mobile', icon: Bell, description: 'Send alerts directly to users devices.' },
  { id: 'f29', name: 'SMS Marketing Integration', category: 'Marketing', icon: MessageSquare, description: 'Reach customers via text messages.' },
  { id: 'f30', name: 'Video Hosting & Streaming', category: 'Media', icon: Video, description: 'Host and stream videos directly from your platform.' },
  { id: 'f31', name: 'Image Optimization Engine', category: 'Media', icon: ImageIcon, description: 'Automatically compress and resize images for faster loading.' },
  { id: 'f32', name: 'Document Management System', category: 'Media', icon: FileText, description: 'Store, organize, and share internal documents.' },
  { id: 'f33', name: 'Interactive Maps Integration', category: 'Location', icon: Map, description: 'Display store locations or track deliveries on a map.' },
  { id: 'f34', name: 'Route Optimization', category: 'Logistics', icon: Route, description: 'Calculate the most efficient routes for deliveries.' },
  { id: 'f35', name: 'Fleet Management', category: 'Logistics', icon: Truck, description: 'Track and manage your delivery vehicles.' },
  { id: 'f36', name: 'Warehouse Management System (WMS)', category: 'Inventory', icon: Boxes, description: 'Optimize warehouse operations and layout.' },
  { id: 'f37', name: 'Barcode Scanning Support', category: 'Inventory', icon: Scan, description: 'Use barcode scanners for quick inventory updates.' },
  { id: 'f38', name: 'RFID Tracking', category: 'Inventory', icon: Wifi, description: 'Track high-value items using RFID technology.' },
  { id: 'f39', name: 'Supplier Portal', category: 'Supply Chain', icon: Users, description: 'Allow suppliers to manage their own catalogs and orders.' },
  { id: 'f40', name: 'Purchase Order Management', category: 'Supply Chain', icon: FileText, description: 'Create and track purchase orders to suppliers.' },
  { id: 'f41', name: 'Dropshipping Integration', category: 'Supply Chain', icon: Truck, description: 'Connect with dropshipping suppliers automatically.' },
  { id: 'f42', name: 'B2B Wholesale Portal', category: 'Sales', icon: Users, description: 'Create a separate portal for wholesale customers.' },
  { id: 'f43', name: 'Quote Generation Tool', category: 'Sales', icon: FileText, description: 'Create professional quotes and proposals quickly.' },
  { id: 'f44', name: 'Contract Management', category: 'Legal', icon: FileText, description: 'Store and manage customer and supplier contracts.' },
  { id: 'f45', name: 'Electronic Signatures', category: 'Legal', icon: Edit3, description: 'Collect legally binding signatures online.' },
  { id: 'f46', name: 'GDPR Compliance Tools', category: 'Legal', icon: Shield, description: 'Tools to help you comply with data privacy regulations.' },
  { id: 'f47', name: 'Accessibility Checker', category: 'System', icon: Eye, description: 'Ensure your site meets accessibility standards.' },
  { id: 'f48', name: 'Translation Management', category: 'Content', icon: Globe, description: 'Manage translations for a multi-lingual site.' },
  { id: 'f49', name: 'SEO Content Analyzer', category: 'Content', icon: Search, description: 'Analyze content for SEO best practices.' },
  { id: 'f50', name: 'Plagiarism Checker', category: 'Content', icon: FileText, description: 'Ensure all published content is original.' },
  { id: 'f51', name: 'Social Proof Widgets', category: 'Marketing', icon: Users, description: 'Display recent sales or reviews to build trust.' },
  { id: 'f52', name: 'Exit-Intent Popups', category: 'Marketing', icon: Layout, description: 'Capture leads before they leave your site.' },
  { id: 'f53', name: 'Gamification Engine', category: 'Engagement', icon: Trophy, description: 'Add game-like elements to increase user engagement.' },
  { id: 'f54', name: 'Community Forum Builder', category: 'Engagement', icon: MessageSquare, description: 'Create a space for your customers to interact.' },
  { id: 'f55', name: 'Event Management System', category: 'Events', icon: Calendar, description: 'Plan, promote, and manage online or offline events.' },
  { id: 'f56', name: 'Ticketing & Registration', category: 'Events', icon: Ticket, description: 'Sell tickets and manage event registrations.' },
  { id: 'f57', name: 'Webinar Integration', category: 'Events', icon: Video, description: 'Host webinars directly from your platform.' },
  { id: 'f58', name: 'Course Creator (LMS)', category: 'Education', icon: BookOpen, description: 'Build and sell online courses.' },
  { id: 'f59', name: 'Quiz & Assessment Builder', category: 'Education', icon: HelpCircle, description: 'Create quizzes to test knowledge or gather leads.' },
  { id: 'f60', name: 'Certificate Generation', category: 'Education', icon: Award, description: 'Automatically issue certificates upon course completion.' },
  { id: 'f61', name: 'Job Board Module', category: 'HR', icon: Briefcase, description: 'Post job openings and manage applications.' },
  { id: 'f62', name: 'Employee Onboarding Portal', category: 'HR', icon: Users, description: 'Streamline the onboarding process for new hires.' },
  { id: 'f63', name: 'Performance Review System', category: 'HR', icon: Star, description: 'Manage employee evaluations and feedback.' },
  { id: 'f64', name: 'Time & Attendance Tracking', category: 'HR', icon: Clock, description: 'Track employee hours and attendance.' },
  { id: 'f65', name: 'Payroll Integration', category: 'HR', icon: DollarSign, description: 'Connect with payroll providers for seamless processing.' },
  { id: 'f66', name: 'Expense Management', category: 'Finance', icon: CreditCard, description: 'Track and approve employee expenses.' },
  { id: 'f67', name: 'Budgeting & Forecasting', category: 'Finance', icon: TrendingUp, description: 'Plan and track your company budget.' },
  { id: 'f68', name: 'Asset Management', category: 'Finance', icon: Database, description: 'Track company assets and depreciation.' },
  { id: 'f69', name: 'Project Management Tool', category: 'Productivity', icon: Layout, description: 'Manage tasks, deadlines, and team collaboration.' },
  { id: 'f70', name: 'Kanban Boards', category: 'Productivity', icon: LayoutDashboard, description: 'Visualize workflows with drag-and-drop boards.' },
  { id: 'f71', name: 'Gantt Chart View', category: 'Productivity', icon: BarChart2, description: 'Plan project timelines with Gantt charts.' },
  { id: 'f72', name: 'Time Tracking (Billable Hours)', category: 'Productivity', icon: Clock, description: 'Track time spent on client projects for billing.' },
  { id: 'f73', name: 'Internal Chat (Slack Alternative)', category: 'Communication', icon: MessageCircle, description: 'Real-time messaging for your team.' },
  { id: 'f74', name: 'Video Conferencing', category: 'Communication', icon: Video, description: 'Host internal video meetings.' },
  { id: 'f75', name: 'Shared Team Inbox', category: 'Communication', icon: Inbox, description: 'Manage generic email addresses (e.g., info@) collaboratively.' },
  { id: 'f76', name: 'Voice over IP (VoIP) Integration', category: 'Communication', icon: Phone, description: 'Make and receive calls directly from the admin panel.' },
  { id: 'f77', name: 'Call Recording & Transcription', category: 'Communication', icon: Mic, description: 'Automatically record and transcribe sales calls.' },
  { id: 'f78', name: 'AI Chatbot Builder', category: 'AI', icon: Bot, description: 'Create custom chatbots for support or sales.' },
  { id: 'f79', name: 'Sentiment Analysis', category: 'AI', icon: Smile, description: 'Analyze customer feedback to gauge sentiment.' },
  { id: 'f80', name: 'Image Recognition API', category: 'AI', icon: ImageIcon, description: 'Automatically tag and categorize uploaded images.' },
  { id: 'f81', name: 'Voice Command Interface', category: 'AI', icon: Mic, description: 'Control the admin panel using voice commands.' },
  { id: 'f82', name: 'Predictive Maintenance', category: 'IoT', icon: Wrench, description: 'Predict equipment failures before they happen.' },
  { id: 'f83', name: 'IoT Device Management', category: 'IoT', icon: Cpu, description: 'Monitor and control connected devices.' },
  { id: 'f84', name: 'Energy Consumption Tracking', category: 'IoT', icon: Zap, description: 'Monitor energy usage across facilities.' },
  { id: 'f85', name: 'Smart Building Integration', category: 'IoT', icon: Home, description: 'Connect with smart building management systems.' },
  { id: 'f86', name: 'Blockchain Ledger', category: 'Web3', icon: Link, description: 'Securely log transactions on a blockchain.' },
  { id: 'f87', name: 'Crypto Payment Gateway', category: 'Web3', icon: Bitcoin, description: 'Accept payments in cryptocurrencies.' },
  { id: 'f88', name: 'NFT Minting Engine', category: 'Web3', icon: Image, description: 'Create and sell Non-Fungible Tokens.' },
  { id: 'f89', name: 'Token Gated Access', category: 'Web3', icon: Lock, description: 'Restrict content access to token holders.' },
  { id: 'f90', name: 'AR Product Viewer', category: 'AR/VR', icon: Box, description: 'Allow customers to view products in Augmented Reality.' },
  { id: 'f91', name: 'Virtual Store Tour', category: 'AR/VR', icon: Map, description: 'Create a 3D virtual tour of your physical store.' },
  { id: 'f92', name: '3D Model Configurator', category: 'AR/VR', icon: Layers, description: 'Let customers customize products in 3D.' },
  { id: 'f93', name: 'Custom Report Builder', category: 'Analytics', icon: FileText, description: 'Create highly customized reports with drag-and-drop.' },
  { id: 'f94', name: 'Data Visualization Studio', category: 'Analytics', icon: PieChart, description: 'Build complex interactive charts and graphs.' },
  { id: 'f95', name: 'Real-time Data Streaming', category: 'Analytics', icon: Activity, description: 'Process and visualize data as it happens.' },
  { id: 'f96', name: 'Anomaly Detection', category: 'Analytics', icon: AlertTriangle, description: 'Automatically flag unusual patterns in your data.' },
  { id: 'f97', name: 'Cohort Analysis', category: 'Analytics', icon: Users, description: 'Analyze user behavior over time by grouping them.' },
  { id: 'f98', name: 'Funnel Optimization', category: 'Analytics', icon: Filter, description: 'Identify drop-off points in your conversion funnels.' },
  { id: 'f99', name: 'Heatmap Tracking', category: 'Analytics', icon: MousePointer, description: 'See where users click and scroll on your site.' },
  { id: 'f100', name: 'Session Recording', category: 'Analytics', icon: Video, description: 'Watch recordings of user sessions to identify UX issues.' },
  { id: 'f101', name: 'Uptime Monitoring', category: 'System', icon: Server, description: 'Monitor your website availability 24/7.' },
  { id: 'f102', name: 'Error Tracking & Crash Reporting', category: 'System', icon: AlertOctagon, description: 'Automatically log and categorize application errors.' },
  { id: 'f103', name: 'Database Query Optimizer', category: 'System', icon: Database, description: 'Identify and optimize slow database queries.' },
  { id: 'f104', name: 'CDN Management', category: 'System', icon: Globe, description: 'Manage your Content Delivery Network settings.' },
  { id: 'f105', name: 'DDoS Protection Dashboard', category: 'Security', icon: Shield, description: 'Monitor and mitigate DDoS attacks.' },
  { id: 'f106', name: 'Vulnerability Scanner', category: 'Security', icon: Search, description: 'Regularly scan your application for security flaws.' },
  { id: 'f107', name: 'Dark Web Monitoring', category: 'Security', icon: Eye, description: 'Check if company credentials have been compromised.' },
  { id: 'f108', name: 'Employee Phishing Simulator', category: 'Security', icon: Mail, description: 'Train employees to recognize phishing attacks.' },
  { id: 'f109', name: 'Automated Penetration Testing', category: 'Security', icon: Crosshair, description: 'Run automated security tests against your infrastructure.' },
  { id: 'f110', name: 'Compliance Policy Manager', category: 'Legal', icon: FileText, description: 'Manage and distribute internal compliance policies.' },
  { id: 'f111', name: 'Foot Traffic Analysis', category: 'Retail AI', icon: Activity, description: 'Track and analyze customer movement patterns in physical stores.' },
  { id: 'f112', name: 'Planogram Compliance AI', category: 'Retail AI', icon: Eye, description: 'Use computer vision to ensure shelves are stocked according to plan.' },
  { id: 'f113', name: 'Smart Shelf Monitoring', category: 'Retail IoT', icon: Database, description: 'Real-time weight and optical sensors to detect out-of-stock items.' },
  { id: 'f114', name: 'Virtual Try-On', category: 'Retail AR', icon: Box, description: 'Allow customers to virtually try on clothes and accessories.' },
  { id: 'f115', name: 'In-Store Navigation', category: 'Retail Location', icon: Map, description: 'Guide customers to products using indoor positioning systems.' },
  { id: 'f116', name: 'Self-Checkout Integration', category: 'Retail Sales', icon: ShoppingCart, description: 'Connect with self-service kiosk hardware and software.' },
  { id: 'f117', name: 'Loss Prevention AI', category: 'Retail Security', icon: Shield, description: 'Detect suspicious behavior and potential shoplifting in real-time.' },
  { id: 'f118', name: 'Queue Management System', category: 'Retail Operations', icon: Clock, description: 'Monitor and optimize checkout wait times and staff allocation.' },
  { id: 'f119', name: 'Beacon Marketing', category: 'Retail Marketing', icon: Bell, description: 'Send personalized offers to customers\' phones when they are near specific aisles.' },
  { id: 'f120', name: 'Endless Aisle Integration', category: 'Retail Sales', icon: Layers, description: 'Allow customers to order out-of-stock items from other locations in-store.' },
  { id: 'f121', name: 'Click & Collect Optimizer', category: 'Retail Logistics', icon: Truck, description: 'Streamline the buy-online-pickup-in-store (BOPIS) workflow.' },
  { id: 'f122', name: 'Curbside Pickup Manager', category: 'Retail Logistics', icon: Smartphone, description: 'Manage and notify staff of customer arrivals for curbside pickup.' },
  { id: 'f123', name: 'Store Heatmaps', category: 'Retail Analytics', icon: PieChart, description: 'Visualize high-traffic areas and cold zones in your physical store.' },
  { id: 'f124', name: 'Staff Shift Optimizer', category: 'Retail HR', icon: Users, description: 'AI-driven scheduling based on predicted foot traffic and sales.' },
  { id: 'f125', name: 'Inventory Accuracy AI', category: 'Retail Inventory', icon: Scan, description: 'Use vision AI to reconcile physical stock with digital records.' },
  { id: 'f126', name: 'Digital Signage Controller', category: 'Retail Marketing', icon: Layout, description: 'Manage and schedule content across all in-store digital displays.' },
  { id: 'f127', name: 'Electronic Shelf Label Sync', category: 'Retail Operations', icon: RefreshCw, description: 'Instantly update physical shelf prices from your central database.' },
  { id: 'f128', name: 'In-Store Audio Sentiment', category: 'Retail AI', icon: Mic, description: 'Analyze ambient store noise and customer interactions for mood insights.' },
  { id: 'f129', name: 'Return Management Portal', category: 'Retail Support', icon: RotateCcw, description: 'A dedicated interface for processing and tracking customer returns.' },
  { id: 'f130', name: 'Gift Registry System', category: 'Retail Sales', icon: Gift, description: 'Allow customers to create and share wishlists for special events.' },
  { id: 'f131', name: 'Loyalty Tier Gamification', category: 'Retail Engagement', icon: Trophy, description: 'Add levels, badges, and challenges to your loyalty program.' },
  { id: 'f132', name: 'Social Commerce Sync', category: 'Retail Marketing', icon: Share2, description: 'Synchronize your catalog with Instagram, TikTok, and Facebook shops.' },
  { id: 'f133', name: 'Live Stream Shopping', category: 'Retail Sales', icon: Video, description: 'Host live video shopping events with real-time purchasing.' },
  { id: 'f134', name: 'Influencer Campaign Tracker', category: 'Retail Marketing', icon: Star, description: 'Track the ROI and performance of influencer collaborations.' },
  { id: 'f135', name: 'Local SEO Optimizer', category: 'Retail Marketing', icon: Search, description: 'Optimize your store listings for local search and Google Maps.' },
  { id: 'f136', name: 'Multi-Store Inventory Sync', category: 'Retail Inventory', icon: Boxes, description: 'Real-time stock visibility across all physical and digital locations.' },
  { id: 'f137', name: 'Franchise Management Portal', category: 'Retail Operations', icon: Briefcase, description: 'Tools for managing multiple franchise locations and compliance.' },
  { id: 'f138', name: 'POS Hardware Integration', category: 'Retail Sales', icon: Monitor, description: 'Direct integration with cash drawers, receipt printers, and card readers.' },
  { id: 'f139', name: 'Mobile POS (mPOS) Module', category: 'Retail Sales', icon: Smartphone, description: 'Turn tablets and phones into portable checkout stations.' },
  { id: 'f140', name: 'Contactless Payment Suite', category: 'Retail Finance', icon: CreditCard, description: 'Support for Apple Pay, Google Pay, and tap-to-pay technologies.' },
  { id: 'f141', name: 'BNPL Integration', category: 'Retail Finance', icon: DollarSign, description: 'Offer "Buy Now, Pay Later" options like Affirm, Klarna, or Afterpay.' },
  { id: 'f142', name: 'Automated VAT Refund', category: 'Retail Finance', icon: FileText, description: 'Streamline tax-free shopping for international tourists.' },
  { id: 'f143', name: 'Cross-Border Shipping', category: 'Retail Logistics', icon: Globe, description: 'Calculate international duties, taxes, and shipping rates instantly.' },
  { id: 'f144', name: 'Sustainability Tracker', category: 'Retail ESG', icon: Leaf, description: 'Monitor and report on the environmental impact of your operations.' },
  { id: 'f145', name: 'Ethical Sourcing Auditor', category: 'Retail Supply Chain', icon: CheckCircle2, description: 'Verify and track the ethical standards of your suppliers.' },
  { id: 'f146', name: 'Carbon Footprint Calculator', category: 'Retail ESG', icon: Activity, description: 'Estimate the carbon footprint of individual products in your catalog.' },
  { id: 'f147', name: 'Circular Economy Module', category: 'Retail ESG', icon: Repeat, description: 'Manage product trade-ins, resale, and recycling programs.' },
  { id: 'f148', name: 'Smart Fitting Room', category: 'Retail IoT', icon: Home, description: 'Interactive mirrors and lighting controls for fitting rooms.' },
  { id: 'f149', name: 'Scent Marketing Sync', category: 'Retail Operations', icon: Wind, description: 'Control in-store fragrance diffusers based on time or traffic.' },
  { id: 'f150', name: 'Background Music Scheduler', category: 'Retail Operations', icon: Music, description: 'Curate and schedule store playlists to match brand identity.' },
  { id: 'f151', name: 'Staff Training VR', category: 'Retail HR', icon: Box, description: 'Immersive virtual reality modules for employee training.' },
  { id: 'f152', name: 'Mystery Shopper Portal', category: 'Retail Support', icon: UserCheck, description: 'Manage mystery shopping assignments and review reports.' },
  { id: 'f153', name: 'Competitor Price AI', category: 'Retail AI', icon: TrendingDown, description: 'Automatically track and react to competitor price changes.' },
  { id: 'f154', name: 'Seasonal Demand Predictor', category: 'Retail AI', icon: Calendar, description: 'Forecast stock needs for holidays and seasonal peaks.' },
  { id: 'f155', name: 'Weather-Based Marketing', category: 'Retail Marketing', icon: Cloud, description: 'Trigger promotions based on local weather conditions.' },
  { id: 'f156', name: 'Local Event Sync', category: 'Retail Marketing', icon: MapPin, description: 'Align promotions with local festivals, sports, or community events.' },
  { id: 'f157', name: 'Demographic Insights', category: 'Retail Analytics', icon: Users, description: 'Analyze neighborhood demographics to optimize store assortment.' },
  { id: 'f158', name: 'Store-to-Store Transfer', category: 'Retail Logistics', icon: ArrowRightLeft, description: 'Optimize the movement of stock between store locations.' },
  { id: 'f159', name: 'Drone Delivery Sync', category: 'Retail Logistics', icon: Plane, description: 'Integration with last-mile drone delivery services.' },
  { id: 'f160', name: 'Autonomous Robot Manager', category: 'Retail Logistics', icon: Bot, description: 'Manage a fleet of sidewalk delivery robots.' },
  { id: 'f161', name: 'Packaging Waste Reducer', category: 'Retail ESG', icon: Trash2, description: 'AI suggestions for minimizing shipping and product packaging.' },
  { id: 'f162', name: 'Product Lifecycle Manager', category: 'Retail Supply Chain', icon: RefreshCw, description: 'Track products from design to disposal or recycling.' },
  { id: 'f163', name: 'Vendor Scorecard', category: 'Retail Supply Chain', icon: BarChart, description: 'Rate suppliers on delivery speed, quality, and cost.' },
  { id: 'f164', name: 'CPFR Collaborative Tool', category: 'Retail Supply Chain', icon: Handshake, description: 'Collaborate with vendors on planning and replenishment.' },
  { id: 'f165', name: 'Open-to-Buy Planner', category: 'Retail Finance', icon: Calculator, description: 'Manage inventory investment and procurement budgets.' },
  { id: 'f166', name: 'Markdown Optimization', category: 'Retail AI', icon: Percent, description: 'AI-driven timing and depth for product markdowns.' },
  { id: 'f167', name: 'Flash Sale Manager', category: 'Retail Sales', icon: Zap, description: 'Tools for creating and managing high-urgency limited-time sales.' },
  { id: 'f168', name: 'Bundle Recommendation', category: 'Retail AI', icon: Package, description: 'Suggest product bundles based on purchase affinity.' },
  { id: 'f169', name: 'Checkout Upsell AI', category: 'Retail AI', icon: ArrowUpCircle, description: 'Real-time upsell suggestions at the point of purchase.' },
  { id: 'f170', name: 'Physical-to-Digital Recovery', category: 'Retail CRM', icon: Mail, description: 'Follow up with in-store visitors who didn\'t buy via email.' },
  { id: 'f171', name: 'QR Code Campaign Manager', category: 'Retail Marketing', icon: QrCode, description: 'Create and track QR codes for in-store engagement.' },
  { id: 'f172', name: 'NFC Tag Product Info', category: 'Retail IoT', icon: Smartphone, description: 'Allow customers to tap products for detailed specs and reviews.' },
  { id: 'f173', name: 'Smart Mirror Integration', category: 'Retail IoT', icon: Maximize, description: 'Connect with interactive mirrors for styling advice.' },
  { id: 'f174', name: 'Body Scanning Fit', category: 'Retail AI', icon: User, description: '3D body scanning for perfect apparel sizing.' },
  { id: 'f175', name: 'Foot Scanning System', category: 'Retail AI', icon: Footprints, description: 'Precise foot measurements for footwear recommendations.' },
  { id: 'f176', name: 'Makeup Virtual Overlay', category: 'Retail AR', icon: Sparkles, description: 'AR-powered virtual makeup try-on for beauty products.' },
  { id: 'f177', name: 'Hair Color Virtual Try-on', category: 'Retail AR', icon: Palette, description: 'Visualize different hair colors in real-time.' },
  { id: 'f178', name: 'Furniture Visualizer', category: 'Retail AR', icon: Sofa, description: 'Place virtual furniture in your room using AR.' },
  { id: 'f179', name: 'Paint Color Visualizer', category: 'Retail AR', icon: Paintbrush, description: 'See how different paint colors look on your walls.' },
  { id: 'f180', name: 'Appliance Fit Checker', category: 'Retail AR', icon: Home, description: 'Check if appliances fit in your space using AR measurements.' },
  { id: 'f181', name: 'Grocery List Optimizer', category: 'Retail AI', icon: ListChecks, description: 'Auto-organize grocery lists by store aisle for efficiency.' },
  { id: 'f182', name: 'Recipe-to-Cart', category: 'Retail Content', icon: Utensils, description: 'One-click addition of recipe ingredients to the shopping cart.' },
  { id: 'f183', name: 'Dietary Restriction Filter', category: 'Retail Content', icon: Filter, description: 'Filter catalog by vegan, gluten-free, keto, and more.' },
  { id: 'f184', name: 'Allergen Alert System', category: 'Retail Support', icon: AlertCircle, description: 'Notify customers of potential allergens in their selected items.' },
  { id: 'f185', name: 'Freshness Tracker', category: 'Retail Inventory', icon: Thermometer, description: 'Monitor shelf life and freshness of perishable goods.' },
  { id: 'f186', name: 'Food Waste Reduction AI', category: 'Retail AI', icon: Trash, description: 'Predictive analytics to minimize food spoilage and waste.' },
  { id: 'f187', name: 'Smart Vending Sync', category: 'Retail IoT', icon: Box, description: 'Monitor and manage automated vending machine inventory.' },
  { id: 'f188', name: 'Pop-up Store Manager', category: 'Retail Operations', icon: Store, description: 'Tools for rapid deployment and management of temporary stores.' },
  { id: 'f189', name: 'Kiosk Mode Interface', category: 'Retail System', icon: Monitor, description: 'Lock down tablets for dedicated customer self-service use.' },
  { id: 'f190', name: 'Customer Feedback Kiosk', category: 'Retail Support', icon: MessageSquare, description: 'Collect real-time feedback at the point of exit.' },
  { id: 'f191', name: 'VIP Concierge Manager', category: 'Retail CRM', icon: Crown, description: 'Manage high-value customer relationships and appointments.' },
  { id: 'f192', name: 'Personal Shopper Booking', category: 'Retail Support', icon: UserPlus, description: 'Allow customers to book styling or shopping sessions.' },
  { id: 'f193', name: 'Alteration Tracker', category: 'Retail Operations', icon: Scissors, description: 'Manage and track tailoring and product alteration requests.' },
  { id: 'f194', name: 'Home Installation Scheduler', category: 'Retail Support', icon: Wrench, description: 'Book and manage professional installation services.' },
  { id: 'f195', name: 'Warranty Manager', category: 'Retail Support', icon: ShieldCheck, description: 'Track product warranties and protection plan enrollments.' },
  { id: 'f196', name: 'Product Recall System', category: 'Retail Security', icon: Megaphone, description: 'Instantly notify affected customers of product recalls.' },
  { id: 'f197', name: 'Counterfeit Detection AI', category: 'Retail Security', icon: SearchCode, description: 'Verify product authenticity using visual and serial analysis.' },
  { id: 'f198', name: 'Brand Protection Suite', category: 'Retail Legal', icon: Gavel, description: 'Monitor online marketplaces for unauthorized sellers.' },
  { id: 'f199', name: 'IP Monitor', category: 'Retail Legal', icon: FileSearch, description: 'Track and protect your trademarks and patents.' },
  { id: 'f200', name: 'Wholesale Bulk Portal', category: 'Retail Sales', icon: Building, description: 'Dedicated interface for high-volume business buyers.' },
  { id: 'f201', name: 'Trade Professional Program', category: 'Retail CRM', icon: HardHat, description: 'Manage discounts and perks for industry professionals.' },
  { id: 'f202', name: 'Interior Designer Portal', category: 'Retail CRM', icon: PenTool, description: 'Tools for designers to manage client projects and sourcing.' },
  { id: 'f203', name: 'Real Estate Staging', category: 'Retail Inventory', icon: Home, description: 'Manage inventory specifically for home staging rentals.' },
  { id: 'f204', name: 'Product Rental System', category: 'Retail Sales', icon: Key, description: 'Manage short-term rentals of tools, gear, or fashion.' },
  { id: 'f205', name: 'Subscription Box Manager', category: 'Retail Sales', icon: Archive, description: 'Tools for managing recurring curated product boxes.' },
  { id: 'f206', name: 'Mystery Box Generator', category: 'Retail Sales', icon: HelpCircle, description: 'Create and sell surprise product bundles.' },
  { id: 'f207', name: 'Pre-order Manager', category: 'Retail Sales', icon: Timer, description: 'Manage reservations and payments for upcoming products.' },
  { id: 'f208', name: 'Crowdfunding Module', category: 'Retail Engagement', icon: Rocket, description: 'Test new product ideas with customer-funded launches.' },
  { id: 'f209', name: 'Co-creation Portal', category: 'Retail Engagement', icon: Lightbulb, description: 'Allow customers to vote on or suggest new product designs.' },
  { id: 'f210', name: 'Review Video Hub', category: 'Retail Content', icon: Play, description: 'Collect and display video reviews from customers.' },
  { id: 'f211', name: 'UGC Moderator', category: 'Retail Content', icon: ShieldAlert, description: 'AI-powered moderation for user-submitted photos and reviews.' },
  { id: 'f212', name: 'Visual Search', category: 'Retail AI', icon: Camera, description: 'Allow customers to search your catalog using photos.' },
  { id: 'f213', name: 'Semantic Search', category: 'Retail AI', icon: Brain, description: 'Natural language search that understands intent, not just keywords.' },
  { id: 'f214', name: 'Voice Search Optimizer', category: 'Retail Marketing', icon: Mic2, description: 'Optimize your catalog for Alexa, Siri, and Google Assistant.' },
  { id: 'f215', name: 'Chat-to-Buy Integration', category: 'Retail Sales', icon: MessageSquarePlus, description: 'Enable direct purchasing within chat and messaging apps.' },
  { id: 'f216', name: 'WhatsApp Business Sync', category: 'Retail Communication', icon: MessageCircle, description: 'Manage orders and support via WhatsApp Business.' },
  { id: 'f217', name: 'Telegram Order Bot', category: 'Retail Communication', icon: Send, description: 'Automated ordering and status updates via Telegram.' },
  { id: 'f218', name: 'Multi-Lingual AI Support', category: 'Retail Support', icon: Languages, description: 'AI support that speaks 50+ languages fluently.' },
  { id: 'f219', name: 'Real-time Staff Translator', category: 'Retail Communication', icon: Repeat, description: 'Help in-store staff communicate with international customers.' },
  { id: 'f220', name: 'Cultural Content Checker', category: 'Retail Content', icon: Globe2, description: 'Ensure marketing content is culturally appropriate globally.' },
  { id: 'f221', name: 'Global Size Converter', category: 'Retail System', icon: Ruler, description: 'Automatically convert sizes between US, UK, EU, and Asian standards.' }
];

// Removed duplicate imports

export default function FeatureMarketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeFeatures, setActiveFeatures] = useState<Set<string>>(new Set());
  const [activatingId, setActivatingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'features'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setActiveFeatures(new Set(data.active || []));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/features');
    });
    return () => unsubscribe();
  }, []);

  const handleActivate = async (id: string) => {
    if (activeFeatures.has(id)) return;
    
    setActivatingId(id);
    try {
      const feature = features.find(f => f.id === id);
      const newActive = new Set(activeFeatures);
      newActive.add(id);
      
      await setDoc(doc(db, 'settings', 'features'), {
        active: Array.from(newActive)
      }, { merge: true });
      
      await logAction('activate_feature', `Activated feature: ${feature?.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/features');
    } finally {
      setActivatingId(null);
    }
  };

  const categories = ['All', ...Array.from(new Set(features.map(f => f.category)))].sort();

  const filteredFeatures = features.filter(feature => {
    const matchesSearch = feature.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          feature.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || feature.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Feature Marketplace</h2>
          <p className="text-white/60 mt-1">Explore and request 100+ advanced modules to supercharge your admin panel.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search features..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none min-w-[150px]"
        >
          {categories.map(cat => (
            <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredFeatures.map(feature => {
          const isActive = activeFeatures.has(feature.id);
          const Icon = feature.icon;
          
          return (
            <div key={feature.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all group flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/5 text-white/60">
                  {feature.category}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-2">{feature.name}</h3>
              <p className="text-sm text-white/60 mb-6 flex-grow">{feature.description}</p>
              
              <button
                onClick={() => handleActivate(feature.id)}
                disabled={isActive || activatingId === feature.id}
                className={`w-full py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  isActive 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default' 
                    : activatingId === feature.id
                    ? 'bg-brand-orange/20 text-brand-orange border border-brand-orange/30 cursor-wait'
                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                {activatingId === feature.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Activating...
                  </>
                ) : isActive ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Feature Active
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Activate Feature
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
      
      {filteredFeatures.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-white/40" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No features found</h3>
          <p className="text-white/60">Try adjusting your search or category filter.</p>
        </div>
      )}
    </div>
  );
}
