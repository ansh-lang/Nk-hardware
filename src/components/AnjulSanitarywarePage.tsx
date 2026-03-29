import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Search, Filter, Phone, Heart } from 'lucide-react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, getDocs, where } from 'firebase/firestore';
import { db, auth } from '../firebase';

interface Product {
  id?: string;
  title: string;
  description: string;
  image: string;
  bgColor: string;
  brand: string;
  category: string;
  features?: string[];
}

const ProductCard = ({ 
  id,
  title, 
  description, 
  image, 
  bgColor, 
  category,
  onClick,
  isFavorite,
  onToggleFavorite,
  onAddToQuote
}: Product & { onClick?: () => void; isFavorite: boolean; onToggleFavorite: (e: React.MouseEvent) => void; onAddToQuote?: (e: React.MouseEvent) => void }) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      onClick={onClick}
      className={`bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-xl transition-all group ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={`h-32 sm:h-48 md:h-64 flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden`}>
        <img src={image} alt={title} className="max-h-full max-w-full object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500" />
        <button 
          onClick={onToggleFavorite}
          className="absolute top-2 right-2 p-2 bg-white/80 rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <Heart size={20} className={isFavorite ? "fill-red-500 text-red-500" : "text-slate-400"} />
        </button>
      </div>
      
      <div className="p-4 md:p-6 flex flex-col flex-grow">
        {category && (
          <div className="inline-flex items-center px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-amber-50 text-amber-600 text-[8px] md:text-[10px] font-bold uppercase tracking-wider mb-2 md:mb-4 border border-amber-100 w-fit">
            {category}
          </div>
        )}
        
        <h3 className="text-sm md:text-xl font-bold text-slate-900 mb-1 md:mb-2 line-clamp-2">{title}</h3>
        <p className="text-slate-500 text-xs md:text-sm mb-3 md:mb-6 flex-grow line-clamp-2">{description}</p>
        
        {onAddToQuote && (
          <button 
            onClick={onAddToQuote}
            className="mt-auto w-full bg-brand-orange text-brand-dark py-2.5 rounded-xl font-bold hover:bg-orange-400 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            Add to Quote
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default function AnjulSanitarywarePage({ onOpenQuote, onProductSelect, onBack, onOpenSizeSelection }: { onOpenQuote: () => void; onProductSelect: (product: any) => void; onBack: () => void; onOpenSizeSelection: (product: any) => void }) {
  const [selectedCollection, setSelectedCollection] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'favorites'), where('userId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const favs = new Set(snapshot.docs.map(doc => doc.data().productId));
      setFavorites(favs);
    }, (error) => {
      console.error("Favorites snapshot error:", error);
    });
    return () => unsubscribe();
  }, []);

  const toggleFavorite = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (!auth.currentUser) return;
    
    const productId = product.id || product.title;
    const favRef = doc(db, 'favorites', `${auth.currentUser.uid}_${productId}`);
    
    if (favorites.has(productId)) {
      await deleteDoc(favRef);
      setFavorites(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    } else {
      await setDoc(favRef, { userId: auth.currentUser.uid, productId, productTitle: product.title });
      setFavorites(prev => new Set(prev).add(productId));
    }
  };

  const anjulProducts: Product[] = [
    // Apex Collection
    { title: "AX-205 BIB COCK NOZZLE", description: "Premium bib cock with nozzle from the Apex Collection. Made with durable P.T.M.T material.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Apex Collection", features: ["15 MM TAPS", "Polytetra Methylene Terephthalate (P.T.M.T)", "Durable & Long-lasting", "Elegant Design"] },
    { title: "AX-206 BIB COCK WASHING M/C", description: "Washing machine bib cock from the Apex Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Apex Collection", features: ["15 MM TAPS", "P.T.M.T Material", "Washing Machine Compatible"] },
    { title: "AX-207 ANGLE COCK", description: "Angle cock from the Apex Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Apex Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "AX-210 STOP COCK MALE", description: "Male stop cock from the Apex Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Apex Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "AX-201 BIB COCK LONG BODY", description: "Long body bib cock from the Apex Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Apex Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "AX-202 BIB COCK MAX", description: "Max bib cock from the Apex Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Apex Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "AX-203 BIB COCK", description: "Standard bib cock from the Apex Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Apex Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "AX-204 PILLAR COCK", description: "Pillar cock from the Apex Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Apex Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "AX-251 BIB COCK LONG BODY FOAM FLOW", description: "Long body bib cock with foam flow from the Apex Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Apex Collection", features: ["15 MM TAPS", "P.T.M.T Material", "Foam Flow"] },
    { title: "AX-208 BIB COCK 2-IN-1", description: "2-in-1 bib cock from the Apex Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Apex Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "AX-209 ANGLE COCK 2-WAY", description: "2-way angle cock from the Apex Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Apex Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "AX-211 SINK COCK", description: "Sink cock from the Apex Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Apex Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "AX-212 MINI SINK COCK", description: "Mini sink cock from the Apex Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Apex Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "AX-213 SWAN NECK", description: "Swan neck tap from the Apex Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Apex Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "AX-214 MINI SWAN NECK", description: "Mini swan neck tap from the Apex Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Apex Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "AX-215 CENTER HOLE BASIN MIXER", description: "Center hole basin mixer from the Apex Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Apex Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "AX-216 SINK MIXER", description: "Sink mixer from the Apex Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Apex Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "AX-217 WALL MIXER NON-TELEPHONIC", description: "Wall mixer non-telephonic from the Apex Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Apex Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "AX-220 WALL MIXER TELEPHONIC", description: "Wall mixer telephonic from the Apex Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Apex Collection", features: ["15 MM TAPS", "P.T.M.T Material", "With Crutch for Provision of Hand Shower"] },
    { title: "AX-218 WALL MIXER WITH L-BEND", description: "Wall mixer with L-bend from the Apex Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Apex Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },

    // Superb Plus Collection
    { title: "ASP-1203 BIB COCK", description: "Bib cock from the Superb Plus Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Superb Plus Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "ASP-1204 PILLAR COCK", description: "Pillar cock from the Superb Plus Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Superb Plus Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "ASP-1205 BIB COCK NOZZLE", description: "Bib cock nozzle from the Superb Plus Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Superb Plus Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "ASP-1207 ANGLE COCK", description: "Angle cock from the Superb Plus Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Superb Plus Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "ASP-1201 BIB COCK LONG BODY", description: "Long body bib cock from the Superb Plus Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Superb Plus Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "ASP-1208 BIB COCK 2-IN-1", description: "2-in-1 bib cock from the Superb Plus Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Superb Plus Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "ASP-1209 ANGLE COCK 2-WAY", description: "2-way angle cock from the Superb Plus Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Superb Plus Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },

    // Superb Collection
    { title: "AS-1105 BIB COCK NOZZLE", description: "Bib cock nozzle from the Superb Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Superb Collection", features: ["15 MM TAPS", "P.T.M.T Material", "Polytetra Methylene Terephthalate"] },
    { title: "AS-1101 BIB COCK LONG BODY", description: "Long body bib cock from the Superb Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Superb Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "AS-1103 BIB COCK", description: "Standard bib cock from the Superb Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Superb Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "AS-1104 PILLAR COCK", description: "Pillar cock from the Superb Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Superb Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "AS-1107 ANGLE COCK", description: "Angle cock from the Superb Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Superb Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "AS-1108 BIB COCK 2-IN-1", description: "2-in-1 bib cock from the Superb Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Superb Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "AS-1109 ANGLE COCK 2 WAY", description: "2-way angle cock from the Superb Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Superb Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "AS-1111 SINK COCK", description: "Sink cock from the Superb Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Superb Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "AS-1113 SWAN NECK", description: "Swan neck tap from the Superb Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Superb Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "AS-1115 CENTER HOLE BASIN MIXER", description: "Center hole basin mixer from the Superb Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Superb Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "AS-1116 SINK MIXER", description: "Sink mixer from the Superb Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Superb Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "AS-1117 WALL MIXER NON TELEPHONIC", description: "Wall mixer non-telephonic from the Superb Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Superb Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "AS-1120 WALL MIXER TELEPHONIC", description: "Wall mixer telephonic from the Superb Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Superb Collection", features: ["15 MM TAPS", "P.T.M.T Material", "With Crutch for Provision of Hand Shower"] },
    { title: "AS-1118 WALL MIXER WITH L-BEND", description: "Wall mixer with L-bend from the Superb Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Superb Collection", features: ["15 MM TAPS", "P.T.M.T Material"] },
    { title: "AS-1161 TOLL EXTENSION", description: "Toll extension from the Superb Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Superb Collection", features: ["15 MM TAPS", "P.T.M.T Material", "No Worries About Height"] },
    { title: "AS-1121 TOLL BODY PILLAR COCK", description: "Toll body pillar cock from the Superb Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Superb Collection", features: ["15 MM TAPS", "P.T.M.T Material", "Available Sizes: 12\", 15\", 18\", 21\", 24\""] },

    // Prince Collection
    { title: "AP-004 PILLAR COCK", description: "Pillar cock from the Prince Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Prince Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-001 BIB COCK LONG BODY", description: "Long body bib cock from the Prince Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Prince Collection", features: ["20 MM TAPS", "P.T.M.T Material", "45 Degree Angle"] },
    { title: "AP-003 BIB COCK", description: "Standard bib cock from the Prince Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Prince Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-019 SINGLE LEVER BASIN MIXER TOLL BODY", description: "Single lever basin mixer toll body from the Prince Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Prince Collection", features: ["20 MM TAPS", "P.T.M.T Material", "Toll Body"] },

    // Prince Plus Collection
    { title: "AP-104 PILLAR COCK", description: "Pillar cock from the Prince Plus Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Prince Plus Collection", features: ["20 MM TAPS", "P.T.M.T Material", "Polytetra Methylene Terephthalate"] },
    { title: "AP-105 BIB COCK NOZZLE", description: "Bib cock nozzle from the Prince Plus Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Prince Plus Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-107 ANGLE COCK", description: "Angle cock from the Prince Plus Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Prince Plus Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-108 BIB COCK 2-IN-1", description: "2-in-1 bib cock from the Prince Plus Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Prince Plus Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-117 WALL MIXER NON TELEPHONIC (SELF MAINTENANCE)", description: "Wall mixer non-telephonic (self maintenance) from the Prince Plus Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Prince Plus Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-120 WALL MIXER TELEPHONIC (WITH CRUTCH FOR PROVISION OF HAND SHOWER)", description: "Wall mixer telephonic from the Prince Plus Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Prince Plus Collection", features: ["20 MM TAPS", "P.T.M.T Material", "With Crutch for Provision of Hand Shower"] },
    { title: "AP-121 WALL MIXER WITH L-BEND", description: "Wall mixer with L-bend from the Prince Plus Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Prince Plus Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-118 WALL MIXER WITH L-BEND (SELF MAINTENANCE)", description: "Wall mixer with L-bend (self maintenance) from the Prince Plus Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Prince Plus Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-124 TOLL BODY PILLAR COCK", description: "Toll body pillar cock from the Prince Plus Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Prince Plus Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-123 WALL MIXER NON TELEPHONIC", description: "Wall mixer non-telephonic from the Prince Plus Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Prince Plus Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-116 SINK MIXER (SELF-MAINTENANCE)", description: "Sink mixer (self-maintenance) from the Prince Plus Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Prince Plus Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-122 SINK MIXER", description: "Sink mixer from the Prince Plus Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Prince Plus Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-119 SINGLE LEVER BASIN MIXER TOLL BODY", description: "Single lever basin mixer toll body from the Prince Plus Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Prince Plus Collection", features: ["20 MM TAPS", "P.T.M.T Material", "Toll Body"] },
    { title: "AP-109 ANGLE COCK 2 WAY", description: "2-way angle cock from the Prince Plus Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Prince Plus Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-111 SINK COCK", description: "Sink cock from the Prince Plus Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Prince Plus Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-113 SWAN NECK", description: "Swan neck tap from the Prince Plus Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Prince Plus Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-115 CENTRE HOLE BASIN MIXER", description: "Centre hole basin mixer from the Prince Plus Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Prince Plus Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-101 BIB COCK LONG BODY", description: "Long body bib cock from the Prince Plus Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Prince Plus Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-103 BIB COCK", description: "Standard bib cock from the Prince Plus Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Prince Plus Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },

    // Useful & Beautiful Collection
    { title: "AP-007 ANGLE COCK", description: "Angle cock from the Useful & Beautiful Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Useful & Beautiful Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-008 BIB COCK 2-IN-1", description: "2-in-1 bib cock from the Useful & Beautiful Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Useful & Beautiful Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-009 ANGLE COCK 2 WAY", description: "2-way angle cock from the Useful & Beautiful Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Useful & Beautiful Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-011 SINK COCK", description: "Sink cock from the Useful & Beautiful Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Useful & Beautiful Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-017 WALL MIXER NON TELEPHONIC (SELF MAINTENANCE)", description: "Wall mixer non-telephonic (self maintenance) from the Useful & Beautiful Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Useful & Beautiful Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-020 WALL MIXER TELEPHONIC (WITH CRUTCH FOR PROVISION OF HAND SHOWER)", description: "Wall mixer telephonic from the Useful & Beautiful Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Useful & Beautiful Collection", features: ["20 MM TAPS", "P.T.M.T Material", "With Crutch for Provision of Hand Shower"] },
    { title: "AP-021 WALL MIXER WITH L-BEND", description: "Wall mixer with L-bend from the Useful & Beautiful Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Useful & Beautiful Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-018 WALL MIXER WITH L-BEND (SELF MAINTENANCE)", description: "Wall mixer with L-bend (self maintenance) from the Useful & Beautiful Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Useful & Beautiful Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-024 TOLL BODY PILLAR COCK", description: "Toll body pillar cock from the Useful & Beautiful Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Useful & Beautiful Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-022 SINK MIXER", description: "Sink mixer from the Useful & Beautiful Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Useful & Beautiful Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-023 WALL MIXER NON TELEPHONIC", description: "Wall mixer non-telephonic from the Useful & Beautiful Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Useful & Beautiful Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-016 SINK MIXER (SELF MAINTENANCE)", description: "Sink mixer (self maintenance) from the Useful & Beautiful Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Useful & Beautiful Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-015 CENTER HOLE BASIN MIXER", description: "Center hole basin mixer from the Useful & Beautiful Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Useful & Beautiful Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "AP-013 SWAN NECK", description: "Swan neck tap from the Useful & Beautiful Collection.", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Useful & Beautiful Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },

    // Prince Nexa Collection
    { title: "APN-1307 ANGLE COCK", description: "Angle cock from the Prince Nexa Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Prince Nexa Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "APN-1308 BIB COCK 2-IN-1", description: "2-in-1 bib cock from the Prince Nexa Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Prince Nexa Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "APN-1309 ANGLE COCK 2 WAY", description: "2-way angle cock from the Prince Nexa Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Prince Nexa Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "APN-1311 SINK COCK", description: "Sink cock from the Prince Nexa Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Prince Nexa Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "APN-1317 WALL MIXER NON TELEPHONIC (SELF MAINTENANCE)", description: "Wall mixer non-telephonic (self maintenance) from the Prince Nexa Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Prince Nexa Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "APN-1320 WALL MIXER TELEPHONIC (WITH CRUTCH FOR PROVISION OF HAND SHOWER)", description: "Wall mixer telephonic from the Prince Nexa Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Prince Nexa Collection", features: ["20 MM TAPS", "P.T.M.T Material", "With Crutch for Provision of Hand Shower"] },
    { title: "APN-1321 WALL MIXER WITH L-BEND", description: "Wall mixer with L-bend from the Prince Nexa Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Prince Nexa Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "APN-1318 WALL MIXER WITH L-BEND (SELF MAINTENANCE)", description: "Wall mixer with L-bend (self maintenance) from the Prince Nexa Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Prince Nexa Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "APN-1324 TOLL BODY PILLAR COCK", description: "Toll body pillar cock from the Prince Nexa Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Prince Nexa Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "APN-1322 SINK MIXER", description: "Sink mixer from the Prince Nexa Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Prince Nexa Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "APN-1323 WALL MIXER NON TELEPHONIC", description: "Wall mixer non-telephonic from the Prince Nexa Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Prince Nexa Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "APN-1316 SINK MIXER (SELF MAINTENANCE)", description: "Sink mixer (self maintenance) from the Prince Nexa Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Prince Nexa Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "APN-1315 CENTER HOLE BASIN MIXER", description: "Center hole basin mixer from the Prince Nexa Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Prince Nexa Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "APN-1313 SWAN NECK", description: "Swan neck tap from the Prince Nexa Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Prince Nexa Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "APN-1319 SINGLE LEVER BASIN MIXER TOLL BODY", description: "Single lever basin mixer toll body from the Prince Nexa Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Prince Nexa Collection", features: ["20 MM TAPS", "P.T.M.T Material", "Toll Body"] },
    { title: "APN-1304 PILLAR COCK", description: "Pillar cock from the Prince Nexa Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Prince Nexa Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "APN-1303 BIB COCK", description: "Standard bib cock from the Prince Nexa Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Prince Nexa Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },
    { title: "APN-1301 BIB COCK LONG BODY", description: "Long body bib cock from the Prince Nexa Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Prince Nexa Collection", features: ["20 MM TAPS", "P.T.M.T Material"] },

    // Seat Cover Collection
    { title: "SC-3104 ROYAL", description: "Royal seat cover from the Seat Cover Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Seat Cover Collection", features: ["Seat Cover"] },
    { title: "SC-3101 AQUA", description: "Aqua seat cover from the Seat Cover Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Seat Cover Collection", features: ["Seat Cover"] },
    { title: "SC-3105 ROYAL BABY", description: "Royal baby seat cover from the Seat Cover Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Seat Cover Collection", features: ["Seat Cover"] },
    { title: "SC-3102 AQUA WITH JET SPRAY", description: "Aqua seat cover with jet spray from the Seat Cover Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Seat Cover Collection", features: ["Seat Cover", "Jet Spray"] },
    { title: "SC-3103 SMART HEAVY", description: "Smart heavy seat cover from the Seat Cover Collection.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Seat Cover Collection", features: ["Seat Cover"] },

    // Mirror Cabinet
    { title: "MC-5015 MIRROR CABINET (WITH SLAB)", description: "Mirror cabinet with slab.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Mirror Cabinet", features: ["Size: 555x350x120 MM", "Colour: White"] },
    { title: "MC-5016 MIRROR CABINET", description: "Mirror cabinet.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Mirror Cabinet", features: ["Size: 450x350x120 MM", "Colour: White"] },

    // Soap Dispenser
    { title: "SD-5021 SOAP DISPENSER", description: "Soap dispenser.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Soap Dispenser", features: ["Size: 400ML"] },
    { title: "SD-5022 SOAP DISPENSER (CHROME)", description: "Soap dispenser (chrome).", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Soap Dispenser", features: ["Size: 400ML", "Chrome Finish"] },

    // Connection Pipe
    { title: "CPG-5031 GOLD SERIES (HOT)", description: "Gold series hot connection pipe.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Connection Pipe", features: ["Size: 12\"/300MM", "High Pressure"] },
    { title: "CPG-5032 GOLD SERIES (HOT)", description: "Gold series hot connection pipe.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Connection Pipe", features: ["Size: 15\"/375MM", "High Pressure"] },
    { title: "CPG-5033 GOLD SERIES (HOT)", description: "Gold series hot connection pipe.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Connection Pipe", features: ["Size: 18\"/450MM", "High Pressure"] },
    { title: "CPG-5034 GOLD SERIES (HOT)", description: "Gold series hot connection pipe.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Connection Pipe", features: ["Size: 24\"/600MM", "High Pressure"] },
    { title: "CPG-5035 GOLD SERIES (HOT)", description: "Gold series hot connection pipe.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Connection Pipe", features: ["Size: 30\"/750MM", "High Pressure"] },
    { title: "CPG-5036 GOLD SERIES (HOT)", description: "Gold series hot connection pipe.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Connection Pipe", features: ["Size: 36\"/900MM", "High Pressure"] },
    { title: "CPG-5037 GOLD SERIES (HOT)", description: "Gold series hot connection pipe.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Connection Pipe", features: ["Size: 48\"/1200MM", "High Pressure"] },
    { title: "CPG-5038 GOLD SERIES (HOT)", description: "Gold series hot connection pipe.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Connection Pipe", features: ["Size: 60\"/1500MM", "High Pressure"] },
    { title: "CPS-5041 SILVER SERIES (COLD)", description: "Silver series cold connection pipe.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Connection Pipe", features: ["Size: 12\"/300MM", "P.T.M.T. NUT"] },
    { title: "CPS-5042 SILVER SERIES (COLD)", description: "Silver series cold connection pipe.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Connection Pipe", features: ["Size: 15\"/375MM", "P.T.M.T. NUT"] },
    { title: "CPS-5043 SILVER SERIES (COLD)", description: "Silver series cold connection pipe.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Connection Pipe", features: ["Size: 18\"/450MM", "P.T.M.T. NUT"] },
    { title: "CPS-5044 SILVER SERIES (COLD)", description: "Silver series cold connection pipe.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Connection Pipe", features: ["Size: 24\"/600MM", "P.T.M.T. NUT"] },
    { title: "CPS-5045 SILVER SERIES (COLD)", description: "Silver series cold connection pipe.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Connection Pipe", features: ["Size: 30\"/750MM", "P.T.M.T. NUT"] },
    { title: "CPS-5046 SILVER SERIES (COLD)", description: "Silver series cold connection pipe.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Connection Pipe", features: ["Size: 36\"/900MM", "P.T.M.T. NUT"] },
    { title: "CPS-5047 SILVER SERIES (COLD)", description: "Silver series cold connection pipe.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Connection Pipe", features: ["Size: 48\"/1200MM", "P.T.M.T. NUT"] },
    { title: "CPS-5048 SILVER SERIES (COLD)", description: "Silver series cold connection pipe.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Connection Pipe", features: ["Size: 60\"/1500MM", "P.T.M.T. NUT"] },

    // Jet Spray
    { title: "JSU-5001 UNI JET", description: "Uni jet spray.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Jet Spray", features: ["Size: 1MTR"] },
    { title: "JSU-5002 UNI JET", description: "Uni jet spray.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Jet Spray", features: ["Size: 1.5MTR"] },
    { title: "JS-5007 PVC STRAIGHT JET", description: "PVC straight jet spray.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Jet Spray", features: ["Size: 1MTR"] },
    { title: "JS-5008 PVC STRAIGHT JET", description: "PVC straight jet spray.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Jet Spray", features: ["Size: 1.5MTR"] },
    { title: "JSM-5003 MULTI JET", description: "Multi jet spray.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Jet Spray", features: ["Size: 1MTR"] },
    { title: "JSM-5004 MULTI JET", description: "Multi jet spray.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Jet Spray", features: ["Size: 1.5MTR"] },
    { title: "JS-5009 PVC MULTI JET", description: "PVC multi jet spray.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Jet Spray", features: ["Size: 1MTR"] },
    { title: "JS-5010 PVC MULTI JET", description: "PVC multi jet spray.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Jet Spray", features: ["Size: 1.5MTR"] },
    { title: "JSS-5005 STRAIGHT JET", description: "Straight jet spray.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Jet Spray", features: ["Size: 1MTR"] },
    { title: "JSS-5006 STRAIGHT JET", description: "Straight jet spray.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Jet Spray", features: ["Size: 1.5MTR"] },
    { title: "AU-5025 PVC URINAL JET SPRAY", description: "PVC urinal jet spray.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Jet Spray", features: [] },

    // Kitchen Sinks & Waste Coupling
    { title: "KS-5081 GLORY KITCHEN STAINLESS STEEL SINK", description: "Glory kitchen stainless steel sink.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Kitchen Sinks & Waste Coupling", features: ["Size: 18X16X8", "Particular: 18X16X8 (OVAL)", "202 (0.9MM THICKNESS)"] },
    { title: "KS-5082 GLORY KITCHEN STAINLESS STEEL SINK", description: "Glory kitchen stainless steel sink.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Kitchen Sinks & Waste Coupling", features: ["Size: 24X18X9", "Particular: 24X18X9 (OVAL)", "202 (0.9MM THICKNESS)"] },
    { title: "KS-5083 GLORY KITCHEN STAINLESS STEEL SINK", description: "Glory kitchen stainless steel sink.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Kitchen Sinks & Waste Coupling", features: ["Size: 45X20X9 (DB)", "Particular: 45X20X9 (DB/OV/P/TB)", "202 (0.9MM THICKNESS)"] },
    { title: "KS-5084 GLORY KITCHEN STAINLESS STEEL SINK", description: "Glory kitchen stainless steel sink.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Kitchen Sinks & Waste Coupling", features: ["Size: 37X18X8 (DB)", "Particular: 37X18X8 (DB/OV/P/TB)", "202 (0.9MM THICKNESS)"] },
    { title: "KS-5085 GLORY KITCHEN STAINLESS STEEL SINK", description: "Glory kitchen stainless steel sink.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-slate-50", brand: "Anjul", category: "Kitchen Sinks & Waste Coupling", features: ["Size: 24X18X9 (CT)", "Particular: 24X18X9 (SQUARE SILENCE)", "202 (0.9MM THICKNESS)"] },
    { title: "KS-5086 GLORY KITCHEN STAINLESS STEEL SINK", description: "Glory kitchen stainless steel sink.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-blue-50", brand: "Anjul", category: "Kitchen Sinks & Waste Coupling", features: ["Size: 18X16X8 (CT)", "Particular: 18X16X8 (SQUARE SILENCE)", "202 (0.9MM THICKNESS)"] },
    { title: "AX-5091 WASTE COUPLING HEAVY", description: "Waste coupling heavy.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-orange-50", brand: "Anjul", category: "Kitchen Sinks & Waste Coupling", features: [] },
    { title: "AX-5092 WASTE COUPLING", description: "Waste coupling.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", bgColor: "bg-emerald-50", brand: "Anjul", category: "Kitchen Sinks & Waste Coupling", features: [] },
  ];

  const collections = ['All', ...Array.from(new Set(anjulProducts.map(p => p.category)))];

  const allProducts = [...anjulProducts, ...dbProducts];

  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCollection = selectedCollection === 'All' || product.category === selectedCollection;
    return matchesSearch && matchesCollection;
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-slate-50 pt-32 pb-20 px-6"
    >
      <div className="max-w-7xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-brand-orange font-bold mb-8 transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100 mb-12 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-bold uppercase tracking-wider mb-4">
              Sanitaryware
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Anjul P.T.M.T Taps</h1>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl">
              Explore the premium range of Anjul sanitaryware, featuring the Apex and Superb Plus collections. Made with durable Polytetra Methylene Terephthalate (P.T.M.T) for long-lasting performance.
            </p>
            <button 
              onClick={onOpenQuote}
              className="bg-brand-orange text-white px-8 py-4 rounded-xl font-bold hover:bg-orange-600 transition-all flex items-center gap-2 shadow-lg shadow-brand-orange/20"
            >
              <Phone size={20} />
              Get Bulk Quote
            </button>
          </div>
          <div className="w-full md:w-1/3 aspect-square bg-slate-100 rounded-2xl overflow-hidden relative">
            <img 
              src="https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop" 
              alt="Anjul Sanitaryware" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
              <div className="text-white font-bold text-xl">15 MM TAPS</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-row overflow-x-auto gap-2 pb-4 overscroll-x-contain [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-200 [&::-webkit-scrollbar-track]:rounded-full">
            {collections.map(collection => (
              <button
                key={collection}
                onClick={() => setSelectedCollection(collection)}
                className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                  selectedCollection === collection 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {collection}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange bg-white"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {filteredProducts.map((product, index) => (
            <ProductCard 
              key={index} 
              {...product}
              isFavorite={favorites.has(product.id || product.title)}
              onToggleFavorite={(e) => toggleFavorite(e, product)}
              onClick={() => onProductSelect(product)}
              onAddToQuote={(e) => {
                e.stopPropagation();
                onOpenSizeSelection(product);
              }}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
            <Filter className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No products found</h3>
            <p className="text-slate-500">Try adjusting your search or collection filter.</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedCollection('All');
              }}
              className="mt-6 text-brand-orange font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
