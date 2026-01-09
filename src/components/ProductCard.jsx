import React from 'react';
import { Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactGA from "react-ga4";

const ProductCard = ({ product, disabled = false }) => {
    const { Name, image: initialImage, link, 'price USD': priceUSD, 'Qc photo': qc } = product;

    // Use initial image directly (Background removal disabled)
    const finalImage = initialImage;

    const isStrictPadding = product.category === 'Shoes';

    const isBeltMode = product.category === 'Belts' ||
        product.subcategory === 'Belts' ||
        (product.Name && (
            product.Name.toLowerCase().includes('belt') ||
            product.Name.toLowerCase().includes('buckle')
        ));

    // Logic for tall items (Pants, Jeans, etc)
    const isTallPadding = product.category === 'Pants/Shorts' ||
        (product.subcategory && ['Jeans', 'Pants', 'Shorts', 'Trousers', 'Joggers', 'Sweatpants', 'Jorts', 'Leggings'].includes(product.subcategory));

    return (
        <motion.a
            href={!disabled ? link : undefined}
            onClick={(e) => {
                if (disabled) {
                    e.preventDefault();
                    return;
                }
                ReactGA.event({
                    category: "Product",
                    action: "Click",
                    label: Name,
                    value: priceUSD ? parseFloat(priceUSD) : 0
                });
            }}
            target={!disabled ? "_blank" : undefined}
            rel={!disabled ? "noopener noreferrer" : undefined}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className={`product-card ${isStrictPadding ? 'wide-mode' : ''} ${isTallPadding ? 'is-tall' : ''} ${isBeltMode ? 'belt-mode' : ''}`}
            style={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                cursor: disabled ? 'default' : 'pointer',
                pointerEvents: 'auto' // Ensure hover still triggers
            }}
        >
            {/* Image Container */}
            <div className="image-container">
                <motion.img
                    layoutId={`img-${Name}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    src={finalImage}
                    alt={Name}
                    className="product-img"
                    loading="lazy"
                    onError={(e) => {
                        e.target.onerror = null;
                        if (e.target.src !== 'https://placehold.co/400x400/111/333?text=Image+Error') {
                            e.target.src = 'https://placehold.co/400x400/111/333?text=Image+Error';
                        }
                    }}
                />

                {/* QC Button */}
                {qc && (
                    <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
                        <div
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.open(qc, '_blank');
                            }}
                            className="qc-button"
                            title="View QC Photos"
                            style={{ position: 'static', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                        >
                            <Camera size={18} />
                        </div>
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className="info-section">
                <h3 className="product-name">
                    {Name}
                </h3>

                <div className="product-price">
                    {priceUSD ? `$${priceUSD}` : 'N/A'}
                </div>

                {/* Buy Button */}
                {link ? (
                    <div className="buy-button">
                        Buy on Mulebuy
                    </div>
                ) : (
                    <button
                        disabled
                        className="no-link-button"
                        onClick={(e) => e.preventDefault()}
                    >
                        No Link Available
                    </button>
                )}
            </div>
        </motion.a>
    );
};

export default ProductCard;
