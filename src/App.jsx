import React, { useState, useEffect, useMemo, useRef } from 'react';
import { fetchProducts } from './services/googleSheets';
import ProductCard from './components/ProductCard';
import { Search, Loader2, Camera, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactGA from "react-ga4";

// Initialize GA4 - Replace with your Measurement ID
const GA_MEASUREMENT_ID = "G-XXXXXXXXXX";
ReactGA.initialize(GA_MEASUREMENT_ID);

function App() {
    useEffect(() => {
        // Track page view on load
        ReactGA.send({ hitType: "pageview", page: window.location.pathname });
    }, []);
    const [products, setProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("All");
    // Removed selectedSubcategory state as it's no longer needed in flattened view
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleCount, setVisibleCount] = useState(16);
    const loadMoreRef = useRef(null);
    const isFetchingMore = useRef(false);
    const faqRef = useRef(null);

    const scrollToFAQ = () => {
        if (currentView !== 'home') {
            setCurrentView('home');
            setTimeout(() => {
                faqRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            faqRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const [currentView, setCurrentView] = useState('home');
    const [dailyBestsellers, setDailyBestsellers] = useState([]);

    // Seeded Random Helper (unchanged)
    const getDailyRandom = (seed) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };

    useEffect(() => {
        const handleDataLoad = (data) => {
            try {
                setProducts(data);

                if (data.length > 0) {
                    const today = new Date();
                    const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

                    const shuffled = [...data].sort((a, b) => {
                        const valA = (a.Name ? a.Name.length : 0) + (parseFloat(a['price USD']) || 0);
                        const valB = (b.Name ? b.Name.length : 0) + (parseFloat(b['price USD']) || 0);
                        const seedA = dateSeed + valA;
                        const seedB = dateSeed + valB;
                        return (getDailyRandom(seedA) - 0.5) - (getDailyRandom(seedB) - 0.5);
                    });

                    const selected = [];
                    const categoryCounts = {};

                    for (const product of shuffled) {
                        if (selected.length >= 8) break;
                        const cat = product.category || 'Other';
                        const currentCount = categoryCounts[cat] || 0;
                        if (currentCount < 2) {
                            selected.push(product);
                            categoryCounts[cat] = currentCount + 1;
                        }
                    }

                    if (selected.length < 8) {
                        for (const product of shuffled) {
                            if (selected.length >= 8) break;
                            if (!selected.includes(product)) selected.push(product);
                        }
                    }
                    setDailyBestsellers(selected);
                }
                setLoading(false);
            } catch (err) {
                console.error("Failed to process loaded products:", err);
                setError("Failed to load catalogue data.");
                setLoading(false);
            }
        };

        // Start Fetching with Callback
        fetchProducts(handleDataLoad);
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentView]);

    const handleLoadMore = () => {
        if (isFetchingMore.current) return;
        isFetchingMore.current = true;

        // Artificial delay for smoother UX
        setTimeout(() => {
            setVisibleCount(prev => prev + 16);
            isFetchingMore.current = false;
        }, 250);
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loading && currentView === 'products') {
                    handleLoadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [loading, currentView, visibleCount]); // Re-run when visible count changes to ensure we observe the new position if needed, though mostly stable

    const navigateToHome = () => {
        setCurrentView('home');
        window.scrollTo(0, 0);
    };

    const navigateToProducts = () => {
        setCurrentView('products');
        setTimeout(() => {
            const productSection = document.getElementById('product-section');
            if (productSection) {
                productSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    };

    const navigateToCookies = () => {
        setCurrentView('cookies');
        window.scrollTo(0, 0);
    };

    const navigateToDataSecurity = () => {
        setCurrentView('datasecurity');
        window.scrollTo(0, 0);
    };

    const navigateToPrivacyPolicy = () => {
        setCurrentView('privacypolicy');
        window.scrollTo(0, 0);
    };

    const navigateToDisclaimer = () => {
        setCurrentView('disclaimer');
        window.scrollTo(0, 0);
    };

    const navigateToTools = () => {
        setCurrentView('tools');
        window.scrollTo(0, 0);
    };

    // DYNAMIC CATEGORY LOGIC
    // We want: [All, Shoes, ...Rest of Subcategories]
    const flattenedCategories = useMemo(() => {
        if (products.length === 0) return ['All'];

        const specificSubcats = new Set();

        products.forEach(p => {
            if (p.category === 'Shoes') {
                specificSubcats.add('Shoes');
            } else if (p.subcategory && p.subcategory !== 'Other') {
                specificSubcats.add(p.subcategory);
            } else if (p.category && p.category !== 'Other') {
                // Fallback if no subcategory but has main category (unlikely with current setup but safe)
                // specificSubcats.add(p.category); 
            }
        });

        const sortedSubs = Array.from(specificSubcats).sort();
        return ['All', ...sortedSubs];
    }, [products]);

    const handleCategoryChange = (category) => {
        if (selectedCategory === category) return;
        setSelectedCategory(category);
        setVisibleCount(16);
        setSearchTerm('');
    };

    // Calculate Counts for Labels
    const categoryCounts = useMemo(() => {
        const counts = { 'All': products.length };

        // Shoes Count
        counts['Shoes'] = products.filter(p => p.category === 'Shoes').length;

        // Subcategory Counts
        products.forEach(p => {
            if (p.category !== 'Shoes' && p.subcategory) {
                counts[p.subcategory] = (counts[p.subcategory] || 0) + 1;
            }
        });

        return counts;
    }, [products]);

    const filteredProducts = products.filter((product) => {
        const searchLower = searchTerm.toLowerCase().trim().replace(/\./g, '');

        // Search Filter
        const searchMatch =
            product.Name.toLowerCase().includes(searchLower) ||
            (product.category && product.category.toLowerCase().includes(searchLower)) ||
            (product.subcategory && product.subcategory.toLowerCase().includes(searchLower));

        if (!searchMatch) return false;

        // Category Filter
        if (selectedCategory === "All") return true;

        if (selectedCategory === "Shoes") {
            return product.category === 'Shoes';
        }

        // Otherwise match Subcategory exactly
        return product.subcategory === selectedCategory;
    });

    const displayedProducts = filteredProducts.slice(0, visibleCount);
    // handleLoadMore moved up to be accessible by effect

    const marqueeItems = useMemo(() => {
        if (dailyBestsellers.length === 0) return [];
        return [...dailyBestsellers, ...dailyBestsellers, ...dailyBestsellers];
    }, [dailyBestsellers]);

    // Header (unchanged)
    const SiteHeader = () => (
        <header className="site-header">
            <div className="topbar">
                <div className="topbar-left">
                    <img
                        src="/trust_logo.png"
                        alt="Home"
                        style={{
                            width: '120px', /* Reverted size */
                            height: 'auto',
                            cursor: 'pointer',
                            objectFit: 'contain',
                            display: 'block',
                            background: 'transparent',
                            /* Removed rotation */
                            /* Removed margins */
                        }}
                        onClick={navigateToHome}
                    />
                </div>

                <nav className="topbar-nav">
                    <a className="nav-link" onClick={navigateToHome}>HOME</a>
                    <a className="nav-link" onClick={navigateToProducts}>PRODUCTS</a>
                    <a className="nav-link" onClick={navigateToTools}>TOOLS</a>
                    <a className="nav-link" onClick={scrollToFAQ}>FAQ</a>
                    <a className="nav-link" href="https://sebyyreps.com" target="_blank" rel="noopener noreferrer">SEBYYREPS</a>
                </nav>

                <div className="topbar-right">
                    <a href="https://discord.gg/YEwQxMcE7B" target="_blank" rel="noopener noreferrer" className="buy-button discord-glow" style={{ width: 'auto', padding: '8px 20px', fontSize: '0.9rem', marginTop: 0, background: 'black', marginRight: '30px', borderRadius: '50px', border: '2px solid var(--color-primary)' }}>JOIN THE DISCORD</a>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {/* TikTok Button */}
                        <a href="https://www.tiktok.com/sebyyreps" target="_blank" rel="noopener noreferrer" style={{
                            width: '32px', height: '32px', borderRadius: '50%', background: 'black',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #333', cursor: 'pointer'
                        }}>
                            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '18px', height: '18px' }}>
                                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                            </svg>
                        </a>

                        {/* Instagram Button */}
                        <a href="https://www.instagram.com/sebyyreps/" target="_blank" rel="noopener noreferrer" style={{
                            width: '32px', height: '32px', borderRadius: '50%', background: 'black',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #333', cursor: 'pointer'
                        }}>
                            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '18px', height: '18px' }}>
                                <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6" />
                            </svg>
                        </a>

                        {/* Telegram Button */}
                        <a href="https://t.me/repheaven_contact" target="_blank" rel="noopener noreferrer" style={{
                            width: '32px', height: '32px', borderRadius: '50%', background: 'black',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #333', cursor: 'pointer'
                        }}>
                            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '18px', height: '18px', marginLeft: '-2px' /* Visual tweak for center */ }}>
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.48-.94-2.4-1.54-1.06-.7 1.15-1.04.58-2.29-.07-.15.27-.47.67-.85C12.87 9.87 14.89 8 14.89 8s-.68.18-2.6 1.4c-.9.56-1.5.76-2.17.75-1.01-.01-1.76-.29-2.24-.45-.7-.24-.75-.46-.35-.74.45-.32 1.25-.67 3.32-1.48 3.51-1.4 5.86-2.34 7.03-2.82 2.07-.86 2.5-.96 2.76-.94.17 0 .56.07.65.29.11.26.09.61.04.79z" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>

            {currentView === 'home' ? (
                <>
                    <h1 className="site-title">REPHEAVEN</h1>
                    <div className="bottom-tagline">CURATED BEST QUALITY FINDS ONLY!</div>
                </>
            ) : (
                <div style={{ height: '20px' }} />
            )}
        </header>
    );

    return (
        <div className="galaxy-bg">
            <SiteHeader />

            {currentView === 'home' && (
                <div style={{ padding: '0 24px 60px', textAlign: 'center', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="showcase-container" style={{ overflow: 'hidden', maxWidth: '100%', background: 'transparent', borderRadius: 'var(--radius-lg)' }}>
                        {!loading && (
                            <motion.div
                                style={{ display: 'flex', gap: '20px', width: 'max-content' }}
                                animate={{ x: ["0%", "-33.33%"] }}
                                transition={{ repeat: Infinity, ease: "linear", duration: 60 }}
                            >
                                {marqueeItems.map((p, i) => (
                                    <div key={`${p.Name}-${i}`} style={{ width: '280px', filter: 'blur(3px)', opacity: 0.8, transform: 'scale(1)' }}>
                                        <ProductCard product={p} disabled={true} />
                                    </div>
                                ))}
                            </motion.div>
                        )}
                        <div className="view-all-overlay">
                            <button className="buy-button discord-glow" onClick={navigateToProducts} style={{ width: 'auto', background: 'black', borderRadius: '50px', border: '2px solid var(--color-primary)', fontSize: '1.5rem', padding: '16px 48px', zIndex: 50, marginTop: 0 }}>VIEW ALL</button>
                        </div>
                    </div>
                    <a href="https://mulebuy.com/register?ref=200829697" target="_blank" rel="noopener noreferrer" className="buy-button discord-glow bottom-cta-btn" style={{ background: 'black', borderRadius: '50px', border: '2px solid var(--color-primary)', fontSize: '1.2rem', padding: '12px 32px', display: 'flex', justifyContent: 'center', alignItems: 'center', textDecoration: 'none', color: 'white', width: 'min(1100px, calc(100% - 48px))', boxSizing: 'border-box', marginTop: '20px' }}>Sign up for $400 in coupons</a>
                    <div style={{ marginTop: '100px', width: '100%' }}>
                        <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.1), 0 0 20px rgba(255,255,255,0.8)', marginBottom: '40px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.05em' }}>BESTSELLERS</h2>
                        <div className="product-grid">
                            {!loading && dailyBestsellers.map((product, i) => (
                                <ProductCard key={`bestseller-${i}`} product={product} />
                            ))}
                        </div>
                    </div>

                    <div className="trust-section">
                        <div className="trust-glow-container">
                            <img src="/trust_logo.png" alt="RepHeaven Logo" className="trust-logo" />
                        </div>
                        <h3 className="trust-title">SHOP WITH CONFIDENCE</h3>
                        <p className="trust-description">
                            RepHeaven delivers the safest and easiest finding & buying experience for new and veteran buyers alike.
                            <br />
                            We curate and verify every find to ensure your shopping experience is seamless.
                            <br />
                            With thousands of quality finds and trusted sellers, you won't need to rely on chaotic spreadsheets anymore.
                        </p>

                        <div className="trust-features-grid">
                            <div className="trust-feature">
                                <div className="feature-header">
                                    <span className="feature-icon">⚡</span>
                                    <h4>Fast</h4>
                                </div>
                                <p>Stay updated with the latest items, shipping tips, and supplier insights. No need to dig through spreadsheets or Reddit</p>
                            </div>
                            <div className="trust-feature">
                                <div className="feature-header">
                                    <span className="feature-icon">🔒</span>
                                    <h4>Safe</h4>
                                </div>
                                <p>Our links are only from reputable sellers, ensuring your goods always arrive without issue and with expected quality</p>
                            </div>
                            <div className="trust-feature">
                                <div className="feature-header">
                                    <span className="feature-icon">☁️</span>
                                    <h4>Trusted</h4>
                                </div>
                                <p>We know that buying reps can be scary. We keep the process beginner-friendly, so you can purchase with confidence</p>
                            </div>
                        </div>
                    </div>
                    <div ref={faqRef}>
                        <FAQSection />
                    </div>
                </div>
            )}

            {currentView === 'products' && (
                <div className="container" style={{ padding: '0 0 60px', marginTop: '20px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '4rem', fontFamily: 'var(--font-heading)', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '-0.02em', textShadow: '0 0 20px rgba(255, 255, 255, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3)', margin: 0, lineHeight: 1, position: 'relative', zIndex: 10 }}>PRODUCTS</h2>
                    </div>

                    {/* FLATTENED PILL GRID */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', marginBottom: '40px', maxWidth: '1000px', margin: '0 auto 40px' }}>
                        {flattenedCategories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => handleCategoryChange(cat)}
                                className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                            >
                                {cat}
                                <span style={{ opacity: 0.7, fontWeight: 500 }}>
                                    ({categoryCounts[cat] || 0})
                                </span>
                            </button>
                        ))}
                    </div>

                    <div style={{ maxWidth: '800px', margin: '0 auto 60px', position: 'relative' }}>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <Search size={24} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)' }} />
                            <input
                                type="text"
                                placeholder="Search here..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    </div>

                    <main>
                        {loading && (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Loader2 size={48} color="white" /></motion.div>
                            </div>
                        )}
                        {error && (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#ef4444' }}>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Oops! Failed to load products.</h3>
                                <p>{error}</p>
                                <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px 20px', background: '#ef4444', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Retry</button>
                            </div>
                        )}
                        {!loading && !error && (
                            <>
                                <div className="product-grid">
                                    <AnimatePresence mode='popLayout'>
                                        {displayedProducts.map((product, index) => <ProductCard key={`${product.Name}-${index}`} product={product} />)}
                                    </AnimatePresence>
                                </div>
                                {visibleCount < filteredProducts.length && (
                                    <div
                                        ref={loadMoreRef}
                                        style={{ height: '60px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '40px' }}
                                    >
                                        <Loader2 className="animate-spin" color="white" opacity={0.5} />
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>
            )}

            {currentView === 'cookies' && <CookiePolicy />}
            {currentView === 'datasecurity' && <DataSecurity />}
            {currentView === 'privacypolicy' && <PrivacyPolicy />}
            {currentView === 'disclaimer' && <Disclaimer />}
            {currentView === 'tools' && <Tools />}

            <Footer
                onCookieClick={navigateToCookies}
                onDataSecurityClick={navigateToDataSecurity}
                onPrivacyPolicyClick={navigateToPrivacyPolicy}
                onDisclaimerClick={navigateToDisclaimer}
            />
        </div>
    );
}

const FAQSection = () => {
    const [activeIndex, setActiveIndex] = useState(null);

    const toggleFAQ = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    const faqData = [
        {
            question: "What is RepHeaven?",
            answer: "RepHeaven is the official website version of my original Google Sheet, rebuilt to provide a faster, smoother experience for both mobile and computer users. It takes all the curated finds you love and organizes them into a premium interface, eliminating the lag and crashing often found with large spreadsheets."
        },
        {
            question: "How often is RepHeaven updated?",
            answer: "We are updated daily! The site features an auto-sync system that connects directly to the Google Sheet. Whenever a new product is added to the spreadsheet, it instantly appears here, ensuring you always have access to the latest drops."
        },
        {
            question: "Will my package get seized by customs?",
            answer: "The short answer is: probably not. The chance of being seized varies depending on what you order and which country you live in. For example, if you live in a country with harsh customs, your chance of getting seized will be higher. To lower the chances of getting seized, you can ship out multiple smaller parcels. Pro tip: ordering multiple pairs of shoes, watches, electronics, or large bulky items will not only make your shipping cost more expensive, but also increase your chance of getting seized."
        },
        {
            question: "What happens after I order an item?",
            answer: "Unlike normal stores, when you order from CNfans, the goods are not instantly delivered to your house. Instead, they are posted to the Mulebuy warehouse in China. If you order multiple items, the Mulebuy staff will package them all into one parcel and then post it to your country / address."
        },
        {
            question: "Does RepHeaven guarantee product authenticity?",
            answer: "No. RepHeaven is a discovery tool for products on third-party marketplaces. We do not manufacture, sell, or handle any items directly. Users are responsible for verifying the quality and authenticity of items before purchasing. We recommend checking reviews and seller ratings on the platform."
        }
    ];

    return (
        <div className="faq-section" style={{ maxWidth: '800px', margin: '20px auto 20px', width: '100%' }}>
            <h2 style={{ textAlign: 'center', fontSize: '3rem', fontFamily: 'var(--font-heading)', color: 'white', marginBottom: '40px', fontWeight: 900 }}>FAQ</h2>
            <div className="faq-container">
                {faqData.map((item, index) => (
                    <div
                        key={index}
                        className={`faq-item ${activeIndex === index ? 'active' : ''}`}
                        onClick={() => toggleFAQ(index)}
                    >
                        <div className="faq-question">
                            <span className="faq-arrow">›</span>
                            <h3>{item.question}</h3>
                        </div>
                        <div className="faq-answer-wrapper" style={{ height: activeIndex === index ? 'auto' : 0, overflow: 'hidden' }}>
                            <div className="faq-answer">
                                {item.answer}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Footer = ({ onCookieClick, onDataSecurityClick, onPrivacyPolicyClick, onDisclaimerClick }) => {
    return (
        <footer className="site-footer">
            {/* Social Row */}
            <div className="social-row">
                <a href="https://www.tiktok.com/@sebyyreps" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg></a>
                <a href="https://t.me/sebyyreps" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295l.214-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" /></svg></a>
                <a href="https://sebyyreps.com" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg></a>
                <a href="https://discord.gg/YEwQxMcE7B" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z" /></svg></a>
                <a href="https://www.instagram.com/sebyyreps/" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg></a>
            </div>

            {/* Glowing Pill Container */}
            <div className="footer-pill">
                <div className="footer-content">
                    {/* Brand / Left */}
                    <div className="footer-column brand-col">
                        <a href="/" style={{ cursor: 'pointer', display: 'block' }}>
                            <img src="/trust_logo.png" alt="RepHeaven" className="footer-logo" />
                        </a>
                    </div>

                    {/* Disclaimer / Middle-Left */}
                    <div className="footer-column text-col">
                        <p>RepHeaven.com is not affiliated with Weidian.com, Taobao.com, 1688.com, Tmall.com, or any other third-party shopping platforms. This website is not an official offer, storefront, or representative of any of these platforms.</p>
                        <p>We are not an online store and do not sell products directly. RepHeaven exists solely as an informational and discovery tool to help users find products that are publicly available on third-party marketplaces.</p>
                        <p className="dimmed">Please note that this website contains affiliate links. If you choose to make a purchase through these links, we may earn a small commission at no additional cost to you. These commissions help support the operation, maintenance, and improvement of the website. We appreciate your support.</p>
                    </div>

                    {/* Links / Middle-Right */}
                    <div className="footer-column links-col">
                        <a onClick={onCookieClick}>Cookie</a>
                        <a onClick={onDataSecurityClick}>Data security</a>
                        <a onClick={onPrivacyPolicyClick}>Privacy policy</a>
                        <a onClick={onDisclaimerClick}>Disclaimer</a>
                    </div>

                    {/* Contact / Right */}
                    <div className="footer-column contact-col">
                        <a href="mailto:sebyyreps@gmail.com" className="contact-icon" style={{ textDecoration: 'none' }}>✉️</a>
                        <a href="mailto:sebyyreps@gmail.com" className="email-link">sebyyreps@gmail.com</a>
                    </div>
                </div>
            </div>

            <div className="copyright-text">
                © 2025 RepHeaven — All rights reserved.
            </div>
        </footer>
    );
};

const CookiePolicy = () => {
    return (
        <div className="container" style={{ padding: '40px 0 100px', color: 'white', maxWidth: '800px' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', marginBottom: '40px', textAlign: 'center' }}>Cookies Policy</h1>

            <div className="policy-content" style={{ lineHeight: '1.8', fontSize: '1.1rem', opacity: 0.9 }}>
                <p style={{ marginBottom: '24px' }}>RepHeaven uses cookies and similar technologies to improve your browsing experience, analyze website traffic, and understand how users interact with our content.</p>

                <h3 style={{ fontSize: '1.5rem', marginTop: '40px', marginBottom: '16px', color: 'white' }}>What are cookies?</h3>
                <p style={{ marginBottom: '24px' }}>Cookies are small text files stored on your device when you visit a website. They help websites remember preferences and improve functionality.</p>

                <h3 style={{ fontSize: '1.5rem', marginTop: '40px', marginBottom: '16px', color: 'white' }}>How we use cookies</h3>
                <p style={{ marginBottom: '16px' }}>We may use cookies to:</p>
                <ul style={{ listStyle: 'disc', paddingLeft: '20px', marginBottom: '24px' }}>
                    <li>Ensure the website functions properly</li>
                    <li>Analyze traffic and usage patterns</li>
                    <li>Improve site performance and user experience</li>
                    <li>Track affiliate referrals and conversions</li>
                </ul>

                <h3 style={{ fontSize: '1.5rem', marginTop: '40px', marginBottom: '16px', color: 'white' }}>Third-party cookies</h3>
                <p style={{ marginBottom: '16px' }}>Some cookies may be set by third-party services we use, such as:</p>
                <ul style={{ listStyle: 'disc', paddingLeft: '20px', marginBottom: '24px' }}>
                    <li>Analytics providers (e.g. traffic and performance tracking)</li>
                    <li>Affiliate platforms that help us track referrals</li>
                </ul>
                <p style={{ marginBottom: '24px' }}>We do not use cookies to personally identify you.</p>

                <h3 style={{ fontSize: '1.5rem', marginTop: '40px', marginBottom: '16px', color: 'white' }}>Managing cookies</h3>
                <p style={{ marginBottom: '24px' }}>You can control or disable cookies at any time through your browser settings. Please note that disabling cookies may affect certain features of the website.</p>

                <p style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>By continuing to use RepHeaven, you consent to the use of cookies in accordance with this policy.</p>
            </div>
        </div>
    );
};

const Tools = () => {
    return (
        <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px', minHeight: '60vh' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '16px', color: 'white', textTransform: 'uppercase' }}>Useful Tools</h1>
                    <p style={{ color: '#a1a1aa', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                        Enhance your shopping experience with these custom-built Chrome extensions.
                    </p>
                </div>

                <div className="tools-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                    {/* Tool 1: CNFans Warning Remover */}
                    <motion.a
                        href="https://chromewebstore.google.com/detail/cnfans-warning-remover-li/mgeolgkdpfigiohpkdloihnppeamoecc?utm_source=item-share-cb"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tool-card"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            display: 'block',
                            background: '#18181b',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            textDecoration: 'none',
                            border: '1px solid #27272a',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
                        }}
                    >
                        <div style={{ height: '220px', overflow: 'hidden', borderBottom: '1px solid #27272a' }}>
                            <img
                                src="/tools/cnfans_tool.png"
                                alt="CNFans Warning Remover"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <div style={{ padding: '24px' }}>
                            <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                CNFans Warning Remover <ExternalLink size={16} color="#a1a1aa" />
                            </h3>
                            <p style={{ color: '#a1a1aa', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                Automatically removes annoying warning popups on CNFans product pages, saving you clicks and frustration.
                            </p>
                        </div>
                    </motion.a>

                    {/* Tool 2: Mulebuy Link Converter */}
                    <motion.a
                        href="https://chromewebstore.google.com/detail/mulebuy-link-converter/hnbghehhhfjcmckplbchkdcadlifombi?utm_source=item-share-cb"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tool-card"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            display: 'block',
                            background: '#18181b',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            textDecoration: 'none',
                            border: '1px solid #27272a',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
                        }}
                    >
                        <div style={{ height: '220px', overflow: 'hidden', borderBottom: '1px solid #27272a' }}>
                            <img
                                src="/tools/mulebuy_tool.jpg"
                                alt="Mulebuy Link Converter"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <div style={{ padding: '24px' }}>
                            <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                Mulebuy Link Converter <ExternalLink size={16} color="#a1a1aa" />
                            </h3>
                            <p style={{ color: '#a1a1aa', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                Quickly convert raw Taobao/Weidian links into Mulebuy links properly. Essential for easy browsing.
                            </p>
                        </div>
                    </motion.a>
                </div>
            </motion.div>
        </div>
    );
};

const DataSecurity = () => {
    return (
        <div className="container" style={{ padding: '40px 0 100px', color: 'white', maxWidth: '800px' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', marginBottom: '40px', textAlign: 'center' }}>Data Security</h1>

            <div className="policy-content" style={{ lineHeight: '1.8', fontSize: '1.1rem', opacity: 0.9 }}>
                <p style={{ marginBottom: '24px' }}>RepHeaven takes reasonable measures to protect the security of our website and its users.</p>

                <h3 style={{ fontSize: '1.5rem', marginTop: '40px', marginBottom: '16px', color: 'white' }}>Information we collect</h3>
                <p style={{ marginBottom: '16px' }}>We do not require users to create accounts or submit personal information to browse RepHeaven.</p>
                <p style={{ marginBottom: '16px' }}>We may collect limited, non-personal data such as:</p>
                <ul style={{ listStyle: 'disc', paddingLeft: '20px', marginBottom: '24px' }}>
                    <li>Device and browser type</li>
                    <li>General location (country/region level)</li>
                    <li>Website usage and interaction data</li>
                </ul>
                <p style={{ marginBottom: '24px' }}>This information is collected in an aggregated and anonymized form and is used solely to improve website performance and user experience.</p>

                <h3 style={{ fontSize: '1.5rem', marginTop: '40px', marginBottom: '16px', color: 'white' }}>How we protect data</h3>
                <p style={{ marginBottom: '16px' }}>We implement appropriate technical and organizational measures to safeguard information, including:</p>
                <ul style={{ listStyle: 'disc', paddingLeft: '20px', marginBottom: '24px' }}>
                    <li>Secure hosting and infrastructure</li>
                    <li>Limited access to administrative systems</li>
                    <li>Use of trusted third-party services for analytics and affiliate tracking</li>
                </ul>
                <p style={{ marginBottom: '24px' }}>We do not sell, rent, or trade user data.</p>

                <h3 style={{ fontSize: '1.5rem', marginTop: '40px', marginBottom: '16px', color: 'white' }}>Third-party services</h3>
                <p style={{ marginBottom: '24px' }}>RepHeaven may use third-party tools (such as analytics or affiliate platforms) that collect data in accordance with their own privacy and security policies. We carefully select reputable providers and only use services necessary to operate and improve the website.</p>

                <h3 style={{ fontSize: '1.5rem', marginTop: '40px', marginBottom: '16px', color: 'white' }}>Data retention</h3>
                <p style={{ marginBottom: '24px' }}>We retain non-personal data only for as long as necessary to analyze site performance and improve our services.</p>

                <h3 style={{ fontSize: '1.5rem', marginTop: '40px', marginBottom: '16px', color: 'white' }}>Your rights</h3>
                <p style={{ marginBottom: '24px' }}>You may control data collection by adjusting your browser settings, including blocking cookies or enabling privacy features. Please note that some website functionality may be affected.</p>

                <h3 style={{ fontSize: '1.5rem', marginTop: '40px', marginBottom: '16px', color: 'white' }}>Changes to this policy</h3>
                <p style={{ marginBottom: '24px' }}>We may update this Data Security policy from time to time. Any changes will be posted on this page.</p>

                <p style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>If you have questions regarding data security or privacy, you may contact us through the website.</p>
            </div>
        </div>
    );
};

const PrivacyPolicy = () => {
    return (
        <div className="container" style={{ padding: '40px 0 100px', color: 'white', maxWidth: '800px' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', marginBottom: '40px', textAlign: 'center' }}>Privacy Policy</h1>

            <div className="policy-content" style={{ lineHeight: '1.8', fontSize: '1.1rem', opacity: 0.9 }}>
                <p style={{ marginBottom: '24px' }}>RepHeaven respects your privacy and is committed to protecting it.</p>

                <h3 style={{ fontSize: '1.5rem', marginTop: '40px', marginBottom: '16px', color: 'white' }}>Information we collect</h3>
                <p style={{ marginBottom: '16px' }}>We do not require users to create accounts or submit personal information to use RepHeaven.</p>
                <p style={{ marginBottom: '16px' }}>We may collect limited, non-personal information automatically, including:</p>
                <ul style={{ listStyle: 'disc', paddingLeft: '20px', marginBottom: '24px' }}>
                    <li>Browser and device information</li>
                    <li>General location (country or region)</li>
                    <li>Pages visited and interaction data</li>
                </ul>
                <p style={{ marginBottom: '24px' }}>This information is collected in an aggregated and anonymized form and is used solely to improve website performance and user experience.</p>

                <h3 style={{ fontSize: '1.5rem', marginTop: '40px', marginBottom: '16px', color: 'white' }}>How we use information</h3>
                <p style={{ marginBottom: '16px' }}>The information we collect may be used to:</p>
                <ul style={{ listStyle: 'disc', paddingLeft: '20px', marginBottom: '24px' }}>
                    <li>Operate and maintain the website</li>
                    <li>Analyze traffic and usage trends</li>
                    <li>Improve content, layout, and functionality</li>
                    <li>Track affiliate referrals and conversions</li>
                </ul>
                <p style={{ marginBottom: '24px' }}>We do not use this data to identify individual users.</p>

                <h3 style={{ fontSize: '1.5rem', marginTop: '40px', marginBottom: '16px', color: 'white' }}>Cookies and tracking technologies</h3>
                <p style={{ marginBottom: '24px' }}>RepHeaven uses cookies and similar technologies to enhance functionality, analyze traffic, and support affiliate tracking. You can manage or disable cookies through your browser settings at any time.</p>
                <p style={{ marginBottom: '24px' }}>For more information, please refer to our Cookies Policy.</p>

                <h3 style={{ fontSize: '1.5rem', marginTop: '40px', marginBottom: '16px', color: 'white' }}>Third-party services</h3>
                <p style={{ marginBottom: '24px' }}>We may use trusted third-party services, such as analytics providers or affiliate platforms, that collect data in accordance with their own privacy policies. RepHeaven does not control how third parties use collected data.</p>
                <p style={{ marginBottom: '24px' }}>We do not sell, rent, or trade user data.</p>

                <h3 style={{ fontSize: '1.5rem', marginTop: '40px', marginBottom: '16px', color: 'white' }}>Data security</h3>
                <p style={{ marginBottom: '24px' }}>We take reasonable steps to protect collected information through secure hosting, access controls, and reputable service providers. However, no method of transmission over the internet is completely secure.</p>

                <h3 style={{ fontSize: '1.5rem', marginTop: '40px', marginBottom: '16px', color: 'white' }}>Your privacy rights</h3>
                <p style={{ marginBottom: '24px' }}>You may control how data is collected by adjusting your browser settings or using privacy tools. Depending on your location, you may have additional rights under applicable data protection laws.</p>

                <h3 style={{ fontSize: '1.5rem', marginTop: '40px', marginBottom: '16px', color: 'white' }}>Changes to this policy</h3>
                <p style={{ marginBottom: '24px' }}>This Privacy Policy may be updated from time to time. Any changes will be posted on this page.</p>

                <p style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>If you have questions regarding this Privacy Policy, you may contact us through the website.</p>
            </div>
        </div>
    );
};

const Disclaimer = () => {
    return (
        <div className="container" style={{ padding: '40px 0 100px', color: 'white', maxWidth: '800px' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', marginBottom: '40px', textAlign: 'center' }}>Disclaimer</h1>

            <div className="policy-content" style={{ lineHeight: '1.8', fontSize: '1.1rem', opacity: 0.9 }}>
                <p style={{ marginBottom: '24px' }}>RepHeaven.com is not affiliated with Weidian.com, Taobao.com, 1688.com, Tmall.com, or any other third-party shopping platforms. This website is not an official offer, storefront, or representative of any of these platforms.</p>

                <p style={{ marginBottom: '24px' }}>We are not an online store and do not sell products directly. RepHeaven exists solely as an informational and discovery tool to help users find products that are publicly available on third-party marketplaces.</p>

                <p style={{ marginBottom: '24px' }}>Please note that this website contains affiliate links. If you choose to make a purchase through these links, we may earn a small commission at no additional cost to you. These commissions help support the operation, maintenance, and improvement of the website. We appreciate your support.</p>
            </div>
        </div>
    );
};

export default App;
