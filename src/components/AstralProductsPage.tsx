import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Search, Filter, Phone, Heart } from 'lucide-react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, where } from 'firebase/firestore';
import { db, auth } from '../firebase';

interface Product {
  id?: string;
  title: string;
  description: string;
  image: string;
  bgColor: string;
  brand: string;
  category: string;
  hsn?: string;
  features?: string[];
  specifications?: { label: string; value: string }[];
  tableData?: { sizeCm: string; sizeInch: string; code: string; pkg: string; price?: string }[];
  size?: string;
  pressureRating?: string;
}

const ProductCard = ({ 
  id,
  title, 
  description, 
  image, 
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
          <div className="inline-flex items-center px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-blue-50 text-blue-600 text-[8px] md:text-[10px] font-bold uppercase tracking-wider mb-2 md:mb-4 border border-blue-100 w-fit">
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

export default function AstralProductsPage({ 
  onOpenQuote, 
  onProductSelect, 
  onBack, 
  onOpenSizeSelection,
  initialCollection = 'All'
}: { 
  onOpenQuote: () => void; 
  onProductSelect: (product: any) => void; 
  onBack: () => void; 
  onOpenSizeSelection: (product: any) => void;
  initialCollection?: string;
}) {
  const [selectedCollection, setSelectedCollection] = useState(initialCollection);
  const [selectedBrand, setSelectedBrand] = useState<string>('Astral');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSize, setSelectedSize] = useState<string>('All');
  const [selectedPressure, setSelectedPressure] = useState<string>('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('All');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelectedCollection(initialCollection);
  }, [initialCollection]);

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

  const astralProducts: Product[] = [
    { 
      title: "SWR Selfit Pipe - Type A", 
      description: "Astral SWR Selfit Pipe Type A for non-pressure applications. Ideal for soil, waste, and rainwater drainage. Manufactured as per IS:13592.", 
      image: "https://images.rawpixel.com/image_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTA1L3Vwd2s2MTY2MTI2Mi13a296dWZ3dy5qcGc.jpg", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39172390",
      features: ["Selfit Jointing", "Corrosion Resistant", "Lightweight", "Chemical Resistant", "Type A - Soil & Waste"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "3M S/S", code: "M411110307", pkg: "01" },
        { sizeCm: "7.5", sizeInch: "6M S/S", code: "M411110607", pkg: "01" },
        { sizeCm: "7.5", sizeInch: "3M D/S", code: "M421110307", pkg: "01" },
        { sizeCm: "7.5", sizeInch: "6M D/S", code: "M421110607", pkg: "01" },
        { sizeCm: "7.5", sizeInch: "2 FT D/S", code: "M421112207", pkg: "01" },
        { sizeCm: "7.5", sizeInch: "3 FT D/S", code: "M421113307", pkg: "01" },
        { sizeCm: "7.5", sizeInch: "4 FT D/S", code: "M421114407", pkg: "01" },
        { sizeCm: "7.5", sizeInch: "6 FT D/S", code: "M421116607", pkg: "01" },
        { sizeCm: "7.5", sizeInch: "12 FT D/S", code: "M421111207*", pkg: "01" },
        { sizeCm: "7.5", sizeInch: "2 FT S/S", code: "M411112207", pkg: "01" },
        { sizeCm: "7.5", sizeInch: "3 FT S/S", code: "M411113307", pkg: "01" },
        { sizeCm: "7.5", sizeInch: "4 FT S/S", code: "M411114407", pkg: "01" },
        { sizeCm: "7.5", sizeInch: "6 FT S/S", code: "M411116607", pkg: "01" },
        { sizeCm: "7.5", sizeInch: "12 FT S/S", code: "M411111207*", pkg: "01" },
        { sizeCm: "9.0", sizeInch: "3M S/S", code: "M411110308", pkg: "01" },
        { sizeCm: "9.0", sizeInch: "6M S/S", code: "M411110608", pkg: "01" },
        { sizeCm: "9.0", sizeInch: "3M D/S", code: "M421110308", pkg: "01" },
        { sizeCm: "9.0", sizeInch: "6M D/S", code: "M421110608", pkg: "01" },
        { sizeCm: "11.0", sizeInch: "3M S/S", code: "M411110309", pkg: "01" },
        { sizeCm: "11.0", sizeInch: "6M S/S", code: "M411110609", pkg: "01" },
        { sizeCm: "11.0", sizeInch: "3M D/S", code: "M421110309", pkg: "01" },
        { sizeCm: "11.0", sizeInch: "6M D/S", code: "M421110609", pkg: "01" },
        { sizeCm: "16.0", sizeInch: "3M S/S", code: "M411110312", pkg: "01" },
        { sizeCm: "16.0", sizeInch: "6M S/S", code: "M411110612", pkg: "01" },
        { sizeCm: "16.0", sizeInch: "3M D/S", code: "M421110312", pkg: "01" },
        { sizeCm: "16.0", sizeInch: "6M D/S", code: "M421110612", pkg: "01" },
      ]
    },
    { 
      title: "SWR Selfit Pipe - Type B", 
      description: "Astral SWR Selfit Pipe Type B for high-performance drainage systems. Designed for heavy-duty applications and soil/waste discharge. Manufactured as per IS:13592.", 
      image: "https://images.rawpixel.com/image_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTA1L3Vwd2s2MTY2MTI2Mi13a296dWZ3dy5qcGc.jpg", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39172390",
      features: ["High Strength", "Leak-Proof", "UV Stabilized", "Long Life", "Type B - Soil, Waste & Rainwater"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "3M S/S", code: "M411120307", pkg: "01" },
        { sizeCm: "7.5", sizeInch: "6M S/S", code: "M411120607", pkg: "01" },
        { sizeCm: "7.5", sizeInch: "3M D/S", code: "M421120307", pkg: "01" },
        { sizeCm: "7.5", sizeInch: "6M D/S", code: "M421120607", pkg: "01" },
        { sizeCm: "9.0", sizeInch: "3 FT S/S", code: "M411123308", pkg: "01" },
        { sizeCm: "9.0", sizeInch: "4 FT S/S", code: "M411124408", pkg: "01" },
        { sizeCm: "9.0", sizeInch: "6 FT S/S", code: "M411126608", pkg: "01" },
        { sizeCm: "11.0", sizeInch: "3M S/S", code: "M411120309", pkg: "01" },
        { sizeCm: "11.0", sizeInch: "6M S/S", code: "M411120609", pkg: "01" },
        { sizeCm: "11.0", sizeInch: "3M D/S", code: "M421120309", pkg: "01" },
        { sizeCm: "11.0", sizeInch: "6M D/S", code: "M421120609", pkg: "01" },
        { sizeCm: "16.0", sizeInch: "3M S/S", code: "M411120312", pkg: "01" },
        { sizeCm: "16.0", sizeInch: "6M S/S", code: "M411120612", pkg: "01" },
        { sizeCm: "20.0", sizeInch: "3M S/S", code: "M411120314*", pkg: "01" },
        { sizeCm: "20.0", sizeInch: "6M S/S", code: "M411120614*", pkg: "01" },
        { sizeCm: "25.0", sizeInch: "3M S/S", code: "M411120316*", pkg: "01" },
        { sizeCm: "25.0", sizeInch: "6M S/S", code: "M411120616*", pkg: "01" },
        { sizeCm: "31.5", sizeInch: "3M S/S", code: "M411120318*", pkg: "01" },
        { sizeCm: "31.5", sizeInch: "6M S/S", code: "M411120618*", pkg: "01" },
      ]
    },
    { 
      title: "SWR Bend 87.5°", 
      description: "Astral SWR Bend 87.5° for smooth directional changes in soil and waste discharge systems. Selfit jointing for leak-proof performance.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Precision Angle", "Smooth Internal Surface", "High Impact Strength", "Selfit Joint"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M252001207", pkg: "38" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "M252001208", pkg: "38" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M252001209", pkg: "24" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "M252001212", pkg: "08" },
      ]
    },
    { 
      title: "SWR Bend 45°", 
      description: "Astral SWR Bend 45° for gradual directional changes. Ideal for soil, waste, and rainwater systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["45 Degree Angle", "Low Friction Loss", "Durable Construction"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M252001107", pkg: "30" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "M252001108", pkg: "18" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M252001109", pkg: "27" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "M252001112", pkg: "10" },
      ]
    },
    { 
      title: "SWR Coupler", 
      description: "Astral SWR Coupler for joining two SWR pipes of the same diameter. Ensures a strong and leak-proof joint.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Perfect Alignment", "Easy to Install", "Chemical Resistant"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M252001607", pkg: "43" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "M252001608", pkg: "27" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M252001609", pkg: "42" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "M252001612", pkg: "14" },
      ]
    },
    { 
      title: "SWR Single Tee", 
      description: "Astral SWR Single Tee for 90-degree branching in drainage systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["90 Degree Branch", "Robust Design", "Leak-Proof"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M252000107", pkg: "41" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "M252000108", pkg: "26" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M252000109", pkg: "15" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "M252000112", pkg: "04" },
      ]
    },
    { 
      title: "SWR Single Tee with Door", 
      description: "Astral SWR Single Tee with Door for easy access and maintenance of drainage lines.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Maintenance Access", "Secure Door Seal", "Durable Material"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M252000207", pkg: "32" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "M252000208", pkg: "20" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M252000209", pkg: "12" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "M252000212", pkg: "04" },
      ]
    },
    { 
      title: "SWR Reducing Tee", 
      description: "Astral SWR Reducing Tee for branching into a smaller diameter pipe.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Efficient Reduction", "Smooth Transition", "High Quality PVC"],
      tableData: [
        { sizeCm: "9.0 x 7.5", sizeInch: "3\" x 2 1/2\"", code: "M252000330", pkg: "28" },
        { sizeCm: "11.0 x 7.5", sizeInch: "4\" x 2 1/2\"", code: "M252000329", pkg: "19" },
        { sizeCm: "11.0 x 9.0", sizeInch: "4\" x 3\"", code: "M252000343", pkg: "16" },
        { sizeCm: "16.0 x 7.5", sizeInch: "6\" x 2 1/2\"", code: "M252000335", pkg: "07" },
        { sizeCm: "16.0 x 11.0", sizeInch: "6\" x 4\"", code: "M252000331", pkg: "06" },
      ]
    },
    { 
      title: "SWR Swept Bend", 
      description: "Astral SWR Swept Bend for very smooth directional changes, reducing the risk of blockages.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Maximum Flow Efficiency", "Anti-Clogging Design", "Long Radius"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M252001007", pkg: "24" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M252001009", pkg: "21" },
      ]
    },
    { 
      title: "SWR Door Bend 87.5° with 50mm Vent", 
      description: "Astral SWR Door Bend with an integrated 50mm vent for system ventilation and access.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Integrated Vent", "Access Door", "Dual Functionality"],
      tableData: [
        { sizeCm: "11.0", sizeInch: "4\"", code: "M252001344", pkg: "18" },
      ]
    },
    { 
      title: "SWR Bend 87.5° with Door", 
      description: "Astral SWR Bend 87.5° with access door for easy cleaning and inspection of the drainage system.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Access Door", "Leak-Proof Seal", "High Impact Resistance"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M252001307", pkg: "20" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "M252001308", pkg: "32" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M252001309", pkg: "18" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "M252001312", pkg: "07" },
      ]
    },
    { 
      title: "SWR Repair Coupler", 
      description: "Astral SWR Repair Coupler designed for quick repairs and modifications in existing SWR pipelines.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Easy Slip-on", "Compact Design", "Durable PVC"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M252001707", pkg: "43" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M252001709", pkg: "42" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "M252001712", pkg: "14" },
      ]
    },
    { 
      title: "SWR Cross Tee", 
      description: "Astral SWR Cross Tee for four-way branching in drainage systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Four-Way Branch", "Strong Joints", "Smooth Flow"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M252000707", pkg: "32" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M252000709", pkg: "09" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "M252000712", pkg: "04" },
      ]
    },
    { 
      title: "SWR Reducing Tee with Door", 
      description: "Astral SWR Reducing Tee with access door for maintenance and branching into smaller pipes.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Access Door", "Reducing Branch", "Leak-Proof"],
      tableData: [
        { sizeCm: "9.0 x 7.5", sizeInch: "3\" x 2 1/2\"", code: "M252000430", pkg: "24" },
        { sizeCm: "11.0 x 7.5", sizeInch: "4\" x 2 1/2\"", code: "M252000429", pkg: "14" },
        { sizeCm: "11.0 x 9.0", sizeInch: "4\" x 3\"", code: "M252000443", pkg: "15" },
        { sizeCm: "16.0 x 7.5", sizeInch: "6\" x 2 1/2\"", code: "M252000435", pkg: "06" },
        { sizeCm: "16.0 x 11.0", sizeInch: "6\" x 4\"", code: "M252000431", pkg: "05" },
      ]
    },
    { 
      title: "SWR Single Tee with LH Door", 
      description: "Astral SWR Single Tee with Left Hand access door for specialized drainage layouts.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["LH Access Door", "90 Degree Branch", "Durable PVC"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M252000507", pkg: "31" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M252000509", pkg: "11" },
      ]
    },
    { 
      title: "SWR Single Tee with RH Door", 
      description: "Astral SWR Single Tee with Right Hand access door for specialized drainage layouts.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["RH Access Door", "90 Degree Branch", "Durable PVC"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M252000607", pkg: "31" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M252000609", pkg: "11" },
      ]
    },
    { 
      title: "SWR Reducer Cross Tee", 
      description: "Astral SWR Reducer Cross Tee for four-way branching with diameter reduction.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Reducing Cross Branch", "Strong Construction", "Smooth Flow"],
      tableData: [
        { sizeCm: "16.0x11.0", sizeInch: "6\"x4\"", code: "M252000731", pkg: "04" },
      ]
    },
    { 
      title: "SWR Reducer Cross Tee with Door", 
      description: "Astral SWR Reducer Cross Tee with access door for maintenance and multi-way branching.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Access Door", "Reducing Cross", "Robust Design"],
      tableData: [
        { sizeCm: "16.0x11.0", sizeInch: "6\"x4\"", code: "M252000831", pkg: "04" },
      ]
    },
    { 
      title: "SWR Cross Tee with Door", 
      description: "Astral SWR Cross Tee with access door for easy maintenance of four-way junctions.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Access Door", "Four-Way Junction", "Leak-Proof"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M252000807", pkg: "24" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M252000809", pkg: "08" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "M252000812", pkg: "03" },
      ]
    },
    { 
      title: "SWR Swept Tee", 
      description: "Astral SWR Swept Tee for smooth 90-degree branching with swept entry to minimize flow resistance.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Swept Entry", "Smooth Flow", "Selfit Joint"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M252000907", pkg: "40" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M252000909", pkg: "15" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "M252000912", pkg: "04" },
      ]
    },
    { 
      title: "SWR Swept Tee with Door", 
      description: "Astral SWR Swept Tee with access door for cleaning and inspection.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Access Door", "Swept Entry", "Leak-Proof Seal"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M252001007", pkg: "30" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M252001009", pkg: "12" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "M252001012", pkg: "04" },
      ]
    },
    { 
      title: "SWR Reducing Swept Tee", 
      description: "Astral SWR Reducing Swept Tee for branching into a smaller pipe with swept entry.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Reducing Branch", "Swept Entry", "High Impact Strength"],
      tableData: [
        { sizeCm: "11.0 x 7.5", sizeInch: "4\" x 2 1/2\"", code: "M252000929", pkg: "18" },
        { sizeCm: "16.0 x 7.5", sizeInch: "6\" x 2 1/2\"", code: "M252000935", pkg: "07" },
        { sizeCm: "16.0 x 11.0", sizeInch: "6\" x 4\"", code: "M252000931", pkg: "05" },
      ]
    },
    { 
      title: "SWR Reducing Swept Tee with Door", 
      description: "Astral SWR Reducing Swept Tee with access door for maintenance.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Access Door", "Reducing Branch", "Durable PVC"],
      tableData: [
        { sizeCm: "11.0 x 7.5", sizeInch: "4\" x 2 1/2\"", code: "M252001029", pkg: "14" },
        { sizeCm: "16.0 x 7.5", sizeInch: "6\" x 2 1/2\"", code: "M252001035", pkg: "04" },
        { sizeCm: "16.0 x 11.0", sizeInch: "6\" x 4\"", code: "M252001031", pkg: "04" },
      ]
    },
    { 
      title: "SWR Single 'Y'", 
      description: "Astral SWR Single 'Y' (45° Wye) for smooth 45-degree branching.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["45 Degree Branch", "Uninterrupted Flow", "Selfit Joint"],
      tableData: [
        { sizeCm: "4.0", sizeInch: "1 1/4\"", code: "M252001904*", pkg: "01" },
        { sizeCm: "5.0", sizeInch: "1 1/2\"", code: "M252001905", pkg: "32" },
        { sizeCm: "6.3", sizeInch: "2\"", code: "M252001906", pkg: "24" },
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M252001907", pkg: "34" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "M252001908*", pkg: "22" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M252001909*", pkg: "12" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "M252001912*", pkg: "04" },
      ]
    },
    { 
      title: "SWR Single 'Y' with Door", 
      description: "Astral SWR Single 'Y' with access door for easy maintenance.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Access Door", "45 Degree Branch", "Secure Seal"],
      tableData: [
        { sizeCm: "5.0", sizeInch: "1 1/2\"", code: "M252002005", pkg: "36" },
        { sizeCm: "6.3", sizeInch: "2\"", code: "M252002006", pkg: "20" },
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M252002007", pkg: "31" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "M252002008*", pkg: "18" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M252002009*", pkg: "09" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "M252002012*", pkg: "04" },
      ]
    },
    { 
      title: "SWR Reducer 'Y'", 
      description: "Astral SWR Reducer 'Y' for 45-degree branching with diameter reduction.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Reducing 45° Branch", "Smooth Transition", "Chemical Resistant"],
      tableData: [
        { sizeCm: "11.0 x 5.0", sizeInch: "4\" x 1 1/2\"", code: "M252002144", pkg: "18" },
        { sizeCm: "11.0 x 6.3", sizeInch: "4\" x 2\"", code: "M252002132*", pkg: "18" },
        { sizeCm: "11.0 x 7.5", sizeInch: "4\" x 2 1/2\"", code: "M252002129*", pkg: "17" },
        { sizeCm: "16.0 x 7.5", sizeInch: "6\" x 2 1/2\"", code: "M252002135*", pkg: "08" },
        { sizeCm: "16.0 x 11.0", sizeInch: "6\" x 4\"", code: "M252002131*", pkg: "05" },
      ]
    },
    { 
      title: "SWR Invert 'Y' 45°", 
      description: "Astral SWR Invert 'Y' 45° for specialized drainage configurations.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Invert 45° Branch", "Precision Fit", "Durable"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M252002507", pkg: "35" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M252002509", pkg: "12" },
      ]
    },
    { 
      title: "SWR Reducer 'Y' with Door", 
      description: "Astral SWR Reducer 'Y' with access door for maintenance of reducing branches.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Access Door", "Reducing 45° Branch", "Leak-Proof"],
      tableData: [
        { sizeCm: "11.0 x 5.0", sizeInch: "4\" x 1 1/2\"", code: "M252002244", pkg: "15" },
        { sizeCm: "11.0 x 6.3", sizeInch: "4\" x 2\"", code: "M252002232*", pkg: "16" },
        { sizeCm: "11.0 x 7.5", sizeInch: "4\" x 2 1/2\"", code: "M252002229*", pkg: "14" },
        { sizeCm: "16.0 x 7.5", sizeInch: "6\" x 2 1/2\"", code: "M252002235*", pkg: "06" },
        { sizeCm: "16.0 x 11.0", sizeInch: "6\" x 4\"", code: "M252002231*", pkg: "05" },
      ]
    },
    { 
      title: "SWR Double 'Y'", 
      description: "Astral SWR Double 'Y' for symmetrical 45-degree branching from both sides.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Double 45° Branch", "High Flow Capacity", "Robust Design"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M252002307", pkg: "24" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M252002309*", pkg: "06" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "M252002312", pkg: "04" },
      ]
    },
    { 
      title: "SWR Double 'Y' with Door", 
      description: "Astral SWR Double 'Y' with access door for maintenance of dual branches.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Access Door", "Double 45° Branch", "Secure Door Seal"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M252002407", pkg: "18" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M252002409*", pkg: "06" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "M252002412", pkg: "04" },
      ]
    },
    { 
      title: "SWR Reducer Double 'Y'", 
      description: "Astral SWR Reducer Double 'Y' for dual 45-degree branching with reduction.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Reducing Double 'Y'", "Symmetrical Flow", "Durable"],
      tableData: [
        { sizeCm: "16.0 x 7.5", sizeInch: "6\" x 2 1/2\"", code: "M252002335", pkg: "05" },
        { sizeCm: "16.0 x 11.0", sizeInch: "6\" x 4\"", code: "M252002331", pkg: "04" },
      ]
    },
    { 
      title: "SWR Reducer Double 'Y' with Door", 
      description: "Astral SWR Reducer Double 'Y' with access door.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Access Door", "Reducing Double 'Y'", "Leak-Proof"],
      tableData: [
        { sizeCm: "16.0 x 7.5", sizeInch: "6\" x 2 1/2\"", code: "M252002435", pkg: "05" },
        { sizeCm: "16.0 x 11.0", sizeInch: "6\" x 4\"", code: "M252002431", pkg: "04" },
      ]
    },
    { 
      title: "SWR Reducer", 
      description: "Astral SWR Reducer for connecting pipes of different diameters.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Diameter Reduction", "Smooth Internal Surface", "Selfit Joint"],
      tableData: [
        { sizeCm: "9.0 x 7.5", sizeInch: "3\" x 2 1/2\"", code: "M252001930*", pkg: "36" },
        { sizeCm: "11.0 x 7.5", sizeInch: "4\" x 2 1/2\"", code: "M252001929*", pkg: "24" },
        { sizeCm: "11.0 x 9.0", sizeInch: "4\" x 3\"", code: "M252001943*", pkg: "24" },
        { sizeCm: "16.0 x 7.5", sizeInch: "6\" x 2 1/2\"", code: "M252001935", pkg: "08" },
        { sizeCm: "16.0 x 11.0", sizeInch: "6\" x 4\"", code: "M252001931*", pkg: "12" },
      ]
    },
    { 
      title: "SWR Cleansing Pipe", 
      description: "Astral SWR Cleansing Pipe with a large access opening for cleaning and maintenance.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Large Access Opening", "Easy Maintenance", "Durable PVC"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M252002607*", pkg: "30" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M252002609*", pkg: "18" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "M252002612*", pkg: "07" },
      ]
    },
    { 
      title: "SWR Sovent", 
      description: "Astral SWR Sovent single-stack drainage system component for high-rise buildings.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Single Stack System", "Space Saving", "Advanced Drainage"],
      tableData: [
        { sizeCm: "11.0", sizeInch: "4\"", code: "M252003509", pkg: "03" },
      ]
    },
    { 
      title: "SWR Vent Cowl", 
      description: "Astral SWR Vent Cowl for protecting the vent pipe from debris and birds.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Vent Protection", "UV Stabilized", "Easy Fit"],
      tableData: [
        { sizeCm: "5.0", sizeInch: "1 1/2\"", code: "M212002705*", pkg: "270" },
        { sizeCm: "6.3", sizeInch: "2\"", code: "M212002706*", pkg: "140" },
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M212002707", pkg: "105" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "M212002708*", pkg: "162" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M212002709*", pkg: "105" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "M212002712*", pkg: "25" },
      ]
    },
    { 
      title: "SWR Vent Cowl with SS Jali", 
      description: "Astral SWR Vent Cowl with Stainless Steel mesh for enhanced protection.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["SS Mesh Protection", "Durable PVC", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "5.0", sizeInch: "1 1/2\"", code: "M212009905*", pkg: "200" },
        { sizeCm: "6.3", sizeInch: "2\"", code: "M212009906*", pkg: "161" },
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M212009907*", pkg: "96" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "M212009908*", pkg: "72" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M212009909*", pkg: "81" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "M212009912*", pkg: "32" },
      ]
    },
    { 
      title: "SWR Pipe Clip", 
      description: "Astral SWR Pipe Clip for secure mounting of SWR pipes to walls or ceilings.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Secure Mounting", "Durable Material", "Easy Installation"],
      tableData: [
        { sizeCm: "4.0", sizeInch: "1 1/4\"", code: "M212002804*", pkg: "385" },
        { sizeCm: "5.0", sizeInch: "1 1/2\"", code: "M212002805*", pkg: "312" },
        { sizeCm: "6.3", sizeInch: "2\"", code: "M212002806*", pkg: "216" },
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M212002807*", pkg: "132" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "M212002808*", pkg: "100" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M212002809*", pkg: "110" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "M212002812*", pkg: "156" },
      ]
    },
    { 
      title: "SWR 'P' Trap", 
      description: "Astral SWR 'P' Trap for maintaining a water seal to prevent foul gases from entering the building.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Water Seal", "Smooth Flow", "Self-Cleaning Design"],
      tableData: [
        { sizeCm: "7.5 x 7.5", sizeInch: "2 1/2\" x 2 1/2\"", code: "M252003590", pkg: "30" },
        { sizeCm: "11.0 x 11.0", sizeInch: "4\" x 4\"", code: "M252003533", pkg: "16" },
        { sizeCm: "11.0 x 11.0 (L)", sizeInch: "4\" x 4\"", code: "M252003533L", pkg: "13" },
        { sizeCm: "11.0 x 11.0 (S)", sizeInch: "4\" x 4\"", code: "M252003533S", pkg: "14" },
      ]
    },
    { 
      title: "SWR Reducing 'P' Trap", 
      description: "Astral SWR Reducing 'P' Trap for connecting smaller waste pipes to the main drainage line.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Reducing Inlet", "Water Seal", "Durable PVC"],
      tableData: [
        { sizeCm: "11.0 x 7.5", sizeInch: "4\" x 2 1/2\"", code: "M212004329", pkg: "11" },
        { sizeCm: "11.0 x 7.5", sizeInch: "4\" x 2 1/2\"", code: "M252004329", pkg: "11" },
        { sizeCm: "12.5 x 11.0", sizeInch: "5\" x 4\"", code: "M212003534", pkg: "14" },
      ]
    },
    { 
      title: "SWR 'Q' Trap", 
      description: "Astral SWR 'Q' Trap for specialized drainage applications.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Water Seal", "Precision Angle", "Robust Design"],
      tableData: [
        { sizeCm: "11.0 x 11.0", sizeInch: "4\" x 4\"", code: "M252003633", pkg: "14" },
        { sizeCm: "12.5 x 11.0", sizeInch: "5\" x 4\"", code: "M252003634", pkg: "14" },
      ]
    },
    { 
      title: "SWR Reducing 'P' Trap with Pan Ring", 
      description: "Astral SWR Reducing 'P' Trap with Pan Ring for direct connection to toilet pans.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Integrated Pan Ring", "Secure Connection", "Water Seal"],
      tableData: [
        { sizeCm: "12.5 x 11.0", sizeInch: "5\" x 4\"", code: "M252003534", pkg: "13" },
        { sizeCm: "12.5 x 11.0 (L)", sizeInch: "5\" x 4\"", code: "M252003534L", pkg: "14" },
      ]
    },
    { 
      title: "SWR 'S' Trap", 
      description: "Astral SWR 'S' Trap for vertical drainage connections.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Vertical Connection", "Water Seal", "Smooth Flow"],
      tableData: [
        { sizeCm: "11.0 x 11.0", sizeInch: "4\" x 4\"", code: "M252003733", pkg: "12" },
        { sizeCm: "12.5 x 11.0", sizeInch: "5\" x 4\"", code: "M252003734", pkg: "12" },
      ]
    },
    { 
      title: "SWR Multi Floor Trap with Jali", 
      description: "Astral SWR Multi Floor Trap with Jali for multi-floor drainage systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Multi-Inlet", "Integrated Jali", "Space Saving"],
      tableData: [
        { sizeCm: "11.0 x 6.3 x 5.0", sizeInch: "4\" x 2\" x 1 1/2\"", code: "M252003207", pkg: "30" },
        { sizeCm: "11.0 x 7.5 / 6.3 x 5.0", sizeInch: "4\" x 2 1/2\" / 2\" x 1 1/2\"", code: "M252003236", pkg: "30" },
        { sizeCm: "11.0 x 7.5 / 6.3 x 5.0", sizeInch: "4\" x 2 1/2\" / 2\" x 1 1/2\"", code: "M252005536", pkg: "20" },
        { sizeCm: "11.0 x 9.0 / 7.5 x 5.0", sizeInch: "4\" x 3\" / 2 1/2\" x 1 1/2\"", code: "M252003209", pkg: "20" },
      ]
    },
    { 
      title: "SWR Multi Floor Trap with Jali (Variant 2)", 
      description: "Astral SWR Multi Floor Trap with Jali, another variant for different floor heights.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Height Adjustable", "Integrated Jali", "Durable"],
      tableData: [
        { sizeCm: "11.0 x 7.5 x 5.0", sizeInch: "4\"", code: "M252003208N", pkg: "30" },
      ]
    },
    { 
      title: "SWR Multi Floor Trap with Jali and Foul Arrester", 
      description: "Astral SWR Multi Floor Trap with Jali and Foul Arrester to prevent foul odors.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Foul Arrester", "Integrated Jali", "Multi-Inlet"],
      tableData: [
        { sizeCm: "11.0 x 7.5 x 4.0", sizeInch: "4\"", code: "M252003210N", pkg: "16" },
      ]
    },
    { 
      title: "SWR Multi Floor Trap Partition Plug with Ring", 
      description: "Astral SWR Multi Floor Trap Partition Plug with Ring for sealing unused inlets.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Secure Seal", "Easy to Install", "Durable PVC"],
      tableData: [
        { sizeCm: "11.0 x 11.0", sizeInch: "4\"", code: "M252008808", pkg: "01" },
      ]
    },
    { 
      title: "SWR Multi Floor Trap Adaptor (Height Riser)", 
      description: "Astral SWR Multi Floor Trap Adaptor for increasing the height of floor traps.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Height Extension", "Precision Fit", "Robust"],
      tableData: [
        { sizeCm: "11.0 x 5.0 / 4.0", sizeInch: "4\"", code: "M212003344", pkg: "28" },
      ]
    },
    { 
      title: "SWR Multi Floor Trap Adaptor (Height Riser) with Wings", 
      description: "Astral SWR Multi Floor Trap Adaptor with Wings for stable installation in concrete.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Support Wings", "Height Extension", "Secure Fit"],
      tableData: [
        { sizeCm: "11.0 x 5.0 / 4.0", sizeInch: "4\"", code: "M252003344R", pkg: "28" },
      ]
    },
    { 
      title: "SWR Multi Floor Trap Partition with Plug", 
      description: "Astral SWR Multi Floor Trap Partition with Plug for internal trap configuration.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Internal Partition", "Includes Plug", "Durable"],
      tableData: [
        { sizeCm: "3\"", sizeInch: "3\"", code: "M252009007", pkg: "01" },
        { sizeCm: "4\"", sizeInch: "4\"", code: "M252009008", pkg: "01" },
        { sizeCm: "5\"", sizeInch: "5\"", code: "M252009009", pkg: "01" },
        { sizeCm: "7\"", sizeInch: "7\"", code: "M252009010", pkg: "01" },
      ]
    },
    { 
      title: "SWR Multi Floor Trap 75mm W.S. (Spigot Type) (Open)", 
      description: "Astral SWR Multi Floor Trap 75mm Water Seal, Spigot Type, Open design.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["75mm Water Seal", "Spigot Type", "Open Design"],
      tableData: [
        { sizeCm: "11.0 x 7.5 x 5.0", sizeInch: "4\"", code: "M092005809", pkg: "12" },
      ]
    },
    { 
      title: "SWR Multi Floor Trap 75mm W.S. (Spigot Type) (Close)", 
      description: "Astral SWR Multi Floor Trap 75mm Water Seal, Spigot Type, Closed design.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["75mm Water Seal", "Spigot Type", "Closed Design"],
      tableData: [
        { sizeCm: "11.0 x 7.5 x 5.0", sizeInch: "4\"", code: "M092006209", pkg: "12" },
      ]
    },
    { 
      title: "SWR Multi Floor Trap Height Riser (Close)", 
      description: "Astral SWR Multi Floor Trap Height Riser, Closed design.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Height Extension", "Closed Design", "Durable"],
      tableData: [
        { sizeCm: "11.0 x 5.0", sizeInch: "4\"", code: "M092006009", pkg: "12" },
      ]
    },
    { 
      title: "SWR Nahani Trap without Jali", 
      description: "Astral SWR Nahani Trap without Jali for floor drainage.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Floor Drainage", "Water Seal", "Smooth Flow"],
      tableData: [
        { sizeCm: "10.0 x 6.3", sizeInch: "4\" x 2\"", code: "M252007106", pkg: "61" },
        { sizeCm: "11.0 x 7.5", sizeInch: "4\" x 2 1/2\"", code: "M252003107N", pkg: "40" },
        { sizeCm: "11.0 x 9.0", sizeInch: "4\" x 3\"", code: "M252003108N", pkg: "32" },
        { sizeCm: "11.0 x 11.0", sizeInch: "4\" x 4\"", code: "M252003109N", pkg: "24" },
      ]
    },
    { 
      title: "SWR Nahani Trap with Jali", 
      description: "Astral SWR Nahani Trap with Jali for floor drainage with debris protection.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Includes Jali", "Floor Drainage", "Water Seal"],
      tableData: [
        { sizeCm: "10.0 x 6.3", sizeInch: "4\" x 2\"", code: "M252007006", pkg: "61" },
      ]
    },
    { 
      title: "SWR Round Jali", 
      description: "Astral SWR Round Jali for floor traps and Nahani traps.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Debris Protection", "Durable PVC", "Easy Fit"],
      tableData: [
        { sizeCm: "6.3", sizeInch: "2\"", code: "M252008506", pkg: "500" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M252008509", pkg: "500" },
      ]
    },
    { 
      title: "SWR Nahani Trap", 
      description: "Astral SWR Nahani Trap for efficient floor drainage.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Floor Drainage", "Robust Design", "Easy Installation"],
      tableData: [
        { sizeCm: "11.0 x 6.3", sizeInch: "4\" x 2\"", code: "M252003106N", pkg: "40" },
      ]
    },
    { 
      title: "SWR Multi Floor Trap Square Cover", 
      description: "Astral SWR Multi Floor Trap Square Cover for a clean finish.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Square Design", "Durable Finish", "Easy Access"],
      tableData: [
        { sizeCm: "11.0 x 11.0", sizeInch: "4\" x 4\"", code: "M252009508", pkg: "200" },
      ]
    },
    { 
      title: "SWR Step Over Bend (SOC)", 
      description: "Astral SWR Step Over Bend for bypassing obstacles in the pipeline.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Obstacle Bypass", "Smooth Flow", "Strong Joint"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "F172002807", pkg: "01" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "F172002809", pkg: "01" },
      ]
    },
    { 
      title: "SWR Long Radius Bend (SOC)", 
      description: "Astral SWR Long Radius Bend for gradual changes in direction.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Gradual Direction Change", "Low Flow Resistance", "Durable"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "F142114707", pkg: "13" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "F142114708", pkg: "06" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "F142114709", pkg: "04" },
      ]
    },
    { 
      title: "SWR Square Gully Trap", 
      description: "Astral SWR Square Gully Trap for efficient waste collection.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Waste Collection", "Robust Construction", "Easy Maintenance"],
      tableData: [
        { sizeCm: "11.0", sizeInch: "4\"", code: "M252003409", pkg: "08" },
      ]
    },
    { 
      title: "SWR Floor Drain with Jali", 
      description: "Astral SWR Floor Drain with integrated Jali for debris filtering.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Integrated Jali", "Debris Filtering", "Smooth Drainage"],
      tableData: [
        { sizeCm: "11.0 x 5.0", sizeInch: "4\" x 2\"", code: "M252003105", pkg: "48" },
      ]
    },
    { 
      title: "SWR Socket Plug", 
      description: "Astral SWR Socket Plug for sealing unused pipeline ends.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Secure Sealing", "Easy to Install", "Durable PVC"],
      tableData: [
        { sizeCm: "4.0", sizeInch: "1 1/4\"", code: "M252002904", pkg: "01" },
        { sizeCm: "5.0", sizeInch: "1 1/2\"", code: "M252002905", pkg: "01" },
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M212002907", pkg: "92" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M212002909", pkg: "36" },
      ]
    },
    { 
      title: "SWR W.C. Connector (Bend)", 
      description: "Astral SWR W.C. Connector Bend for toilet connections.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Toilet Connection", "Leak-Proof", "Precision Fit"],
      tableData: [
        { sizeCm: "11.0", sizeInch: "4\"", code: "M172005909", pkg: "24" },
      ]
    },
    { 
      title: "SWR W.C. Connector (Straight)", 
      description: "Astral SWR W.C. Connector Straight for toilet connections.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Toilet Connection", "Straight Design", "Durable"],
      tableData: [
        { sizeCm: "11.0 (Type A)", sizeInch: "4\"", code: "F172006009", pkg: "06" },
        { sizeCm: "11.0 (Type B)", sizeInch: "4\"", code: "F172006009B", pkg: "06" },
      ]
    },
    { 
      title: "SWR W.C. Connector (Reducer)", 
      description: "Astral SWR W.C. Connector Reducer for connecting different pipe sizes to toilets.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Reducing Connection", "Secure Fit", "High Quality"],
      tableData: [
        { sizeCm: "12.5 x 11.0", sizeInch: "5\" x 4\"", code: "M212003834", pkg: "40" },
      ]
    },
    { 
      title: "SWR Door Cap", 
      description: "Astral SWR Door Cap for sealing access points.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Access Point Sealing", "Easy to Remove", "Leak-Proof"],
      tableData: [
        { sizeCm: "5.0", sizeInch: "1 1/2\"", code: "M212004005", pkg: "300" },
        { sizeCm: "6.3", sizeInch: "2\"", code: "M212004006", pkg: "300" },
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M212004007", pkg: "300" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "M212004008", pkg: "200" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M212004009", pkg: "150" },
      ]
    },
    { 
      title: "SWR Fabricated Reducing Connector", 
      description: "Astral SWR Fabricated Reducing Connector for custom pipe size transitions.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Custom Transition", "Fabricated Quality", "Strong Joint"],
      tableData: [
        { sizeCm: "11.0 x 7.5", sizeInch: "4\" x 2 1/2\"", code: "F182005729", pkg: "01" },
      ]
    },
    { 
      title: "SWR Pan Connector (Straight)", 
      description: "Astral SWR Pan Connector Straight for connecting toilet pans to the drainage line.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Pan Connection", "Straight Design", "Leak-Proof"],
      tableData: [
        { sizeCm: "12.5 x 11.0", sizeInch: "5\" x 4\"", code: "M1420012834", pkg: "24" },
      ]
    },
    { 
      title: "SWR Pan Connector (18mm Offset)", 
      description: "Astral SWR Pan Connector with 18mm offset for flexible toilet pan positioning.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["18mm Offset", "Flexible Positioning", "Durable"],
      tableData: [
        { sizeCm: "12.5 x 11.0", sizeInch: "5\" x 4\"", code: "M1420012934", pkg: "24" },
      ]
    },
    { 
      title: "SWR Pan Connector (40mm Offset)", 
      description: "Astral SWR Pan Connector with 40mm offset for flexible toilet pan positioning.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["40mm Offset", "Flexible Positioning", "Durable"],
      tableData: [
        { sizeCm: "12.5 x 11.0", sizeInch: "5\" x 4\"", code: "M1420013034", pkg: "18" },
      ]
    },
    { 
      title: "SWR Plain Floor Trap", 
      description: "Astral SWR Plain Floor Trap for efficient drainage collection.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Efficient Collection", "Robust Design", "Smooth Flow"],
      tableData: [
        { sizeCm: "11.0 x 7.5 (H-4)", sizeInch: "4\" x 2 1/2\"", code: "M252006908", pkg: "48" },
        { sizeCm: "11.0 x 7.5 (H-5)", sizeInch: "4\" x 2 1/2\"", code: "M252006909", pkg: "32" },
      ]
    },
    { 
      title: "SWR Eccentric Reducing Bush", 
      description: "Astral SWR Eccentric Reducing Bush for connecting pipes of different diameters with offset.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Eccentric Reduction", "Offset Connection", "Strong Joint"],
      tableData: [
        { sizeCm: "11.0 x 6.3", sizeInch: "4\" x 2\"", code: "M212003032", pkg: "38" },
        { sizeCm: "11.0 x 7.5", sizeInch: "4\" x 2 1/2\"", code: "M212003029", pkg: "38" },
        { sizeCm: "11.0 x 9.0", sizeInch: "4\" x 3\"", code: "M212003043", pkg: "38" },
        { sizeCm: "16.0 x 11.0", sizeInch: "6\" x 4\"", code: "M212003031", pkg: "09" },
      ]
    },
    { 
      title: "SWR Straight Reducing Bush", 
      description: "Astral SWR Straight Reducing Bush for connecting pipes of different diameters.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Straight Reduction", "Secure Fit", "Durable"],
      tableData: [
        { sizeCm: "16.0 x 7.5", sizeInch: "6\" x 2 1/2\"", code: "M212007535", pkg: "09" },
        { sizeCm: "16.0 x 11.0", sizeInch: "6\" x 4\"", code: "M212007531", pkg: "09" },
      ]
    },
    { 
      title: "SWR Tee 90° (All Side Socket)", 
      description: "Astral SWR Tee 90° with all side sockets for multi-way branching.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["All Side Socket", "90 Degree Branch", "Smooth Flow"],
      tableData: [
        { sizeCm: "5.0", sizeInch: "1 1/2\"", code: "M2520010605", pkg: "60" },
        { sizeCm: "6.3", sizeInch: "2\"", code: "M2520010606", pkg: "50" },
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M2520010607", pkg: "40" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "M2520010608", pkg: "32" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M2520010609", pkg: "18" },
        { sizeCm: "14.0", sizeInch: "5\"", code: "M2520010611", pkg: "08" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "M2520010612", pkg: "05" },
      ]
    },
    { 
      title: "SWR Door Tee 90° (All Side Socket)", 
      description: "Astral SWR Door Tee 90° with all side sockets and access door.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Access Door", "All Side Socket", "Easy Maintenance"],
      tableData: [
        { sizeCm: "5.0", sizeInch: "1 1/2\"", code: "M2520010505", pkg: "50" },
        { sizeCm: "6.3", sizeInch: "2\"", code: "M2520010506", pkg: "40" },
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M2520010507", pkg: "32" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "M2520010508", pkg: "24" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M2520010509", pkg: "15" },
        { sizeCm: "14.0", sizeInch: "5\"", code: "M2520010511", pkg: "08" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "M2520010512", pkg: "04" },
      ]
    },
    { 
      title: "SWR Multi Floor Trap Without Jali", 
      description: "Astral SWR Multi Floor Trap for multi-level drainage without Jali.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Multi Floor Design", "Without Jali", "Robust Construction"],
      tableData: [
        { sizeCm: "11.0 x 7.5 (H-4)", sizeInch: "4\" x 2 1/2\"", code: "M252009408N", pkg: "30" },
      ]
    },
    { 
      title: "SWR Plain Floor Trap (with 50mm Water Seal)", 
      description: "Astral SWR Plain Floor Trap with a deep 50mm water seal for odor control.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["50mm Water Seal", "Odor Control", "Smooth Flow"],
      tableData: [
        { sizeCm: "11.0 x 7.5 (H-4)", sizeInch: "4\" x 2 1/2\"", code: "M252005808", pkg: "30" },
      ]
    },
    { 
      title: "SWR Roof Corner Trap", 
      description: "Astral SWR Roof Corner Trap for efficient rainwater collection from roof corners.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Roof Corner Design", "Rainwater Collection", "Durable"],
      tableData: [
        { sizeCm: "11.0 (H-4)", sizeInch: "4\"", code: "M252005609", pkg: "08" },
      ]
    },
    { 
      title: "SWR Elbow 90° (All Side Socket)", 
      description: "Astral SWR Elbow 90° with all side sockets for direction changes.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["All Side Socket", "90 Degree Bend", "Strong Joint"],
      tableData: [
        { sizeCm: "5.0", sizeInch: "1 1/2\"", code: "M2520010705", pkg: "01" },
        { sizeCm: "6.3", sizeInch: "2\"", code: "M2520010706", pkg: "01" },
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M2520010707", pkg: "63" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "M2520010708", pkg: "33" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M2520010709", pkg: "24" },
        { sizeCm: "14.0", sizeInch: "5\"", code: "M2520010711", pkg: "13" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "M2520010712", pkg: "08" },
      ]
    },
    { 
      title: "SWR Clean Out", 
      description: "Astral SWR Clean Out for easy access to the pipeline for cleaning.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Easy Cleaning Access", "Secure Cap", "Durable PVC"],
      tableData: [
        { sizeCm: "6.3", sizeInch: "2\"", code: "M2520010106", pkg: "64" },
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M2520010107", pkg: "64" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "M2520010108", pkg: "51" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M2520010109", pkg: "45" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "M2520010112", pkg: "18" },
      ]
    },
    { 
      title: "SWR Door Elbow 90° (All Side Socket)", 
      description: "Astral SWR Door Elbow 90° with all side sockets and access door.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Access Door", "All Side Socket", "Easy Maintenance"],
      tableData: [
        { sizeCm: "5.0", sizeInch: "1 1/2\"", code: "M2520010405", pkg: "48" },
        { sizeCm: "6.3", sizeInch: "2\"", code: "M2520010406", pkg: "25" },
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "M2520010407", pkg: "40" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "M2520010408", pkg: "25" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "M2520010409", pkg: "20" },
        { sizeCm: "14.0", sizeInch: "5\"", code: "M2520010411", pkg: "12" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "M2520010412", pkg: "06" },
      ]
    },
    { 
      title: "SWR WC Bend", 
      description: "Astral SWR WC Bend for toilet pan connections.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Toilet Connection", "Precision Bend", "Leak-Proof"],
      tableData: [
        { sizeCm: "55.0 x 11.0", sizeInch: "22\" x 4\"", code: "CWFL5511", pkg: "01" },
      ]
    },
    { 
      title: "SWR Socket Reducer", 
      description: "Astral SWR Socket Reducer for connecting different pipe sizes.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39269099",
      features: ["Size Reduction", "Secure Fit", "Durable PVC"],
      tableData: [
        { sizeCm: "5.0 x 7.5 x 5.0", sizeInch: "2\" x 3\" x 2\"", code: "TAR07550", pkg: "01" },
      ]
    },
    { 
      title: "SWR Level Inverter Reducer", 
      description: "Astral SWR Level Inverter Reducer for maintaining flow levels during size reduction.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39269099",
      features: ["Level Inversion", "Smooth Flow", "Robust Design"],
      tableData: [
        { sizeCm: "12.0 x 10.0 x 11.0", sizeInch: "4 3/4\" x 4\" x 4 1/4\"", code: "RC110100", pkg: "01" },
      ]
    },
    { 
      title: "Astral PTFE Tape", 
      description: "Astral PTFE Tape for leak-proof threaded joints.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Accessories", 
      hsn: "39199090",
      features: ["Leak-Proof Joints", "12mm Width", "High Quality"],
      tableData: [
        { sizeCm: "4m", sizeInch: "4m", code: "M003302004", pkg: "01" },
        { sizeCm: "8m", sizeInch: "8m", code: "M003302007", pkg: "01" },
        { sizeCm: "8m (Heavy)", sizeInch: "8m", code: "M003302017", pkg: "01" },
      ]
    },
    { 
      title: "Astral Bondset Fast Setting", 
      description: "Astral Bondset Fast Setting epoxy for quick repairs and bonding.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Accessories", 
      hsn: "32141000",
      features: ["Fast Setting", "Strong Bond", "Versatile Use"],
      tableData: [
        { sizeCm: "50gm", sizeInch: "50gm", code: "M000702051", pkg: "01" },
        { sizeCm: "100gm", sizeInch: "100gm", code: "M000702050", pkg: "01" },
      ]
    },
    { 
      title: "Astral Floor Drain Tile", 
      description: "Astral Floor Drain Tile for a seamless and aesthetic drainage finish.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      hsn: "39174000",
      features: ["Seamless Finish", "Aesthetic Design", "Durable"],
      tableData: [
        { sizeCm: "10.0", sizeInch: "4\"", code: "M112007208", pkg: "32" },
        { sizeCm: "10.0 (Ivory)", sizeInch: "4\"", code: "M112007208I", pkg: "32" },
        { sizeCm: "11.0", sizeInch: "4 1/4\"", code: "M112007508", pkg: "24" },
        { sizeCm: "11.0 (Ivory)", sizeInch: "4 1/4\"", code: "M112007508I", pkg: "24" },
      ]
    },
    { 
      title: "Astral Toolkit Box", 
      description: "Astral Toolkit Box for storing and organizing plumbing tools.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Accessories", 
      hsn: "39174000",
      features: ["Tool Organization", "Durable Plastic", "Portable"],
      tableData: [
        { sizeCm: "30.0", sizeInch: "12\"", code: "M252009100", pkg: "10" },
      ]
    },
    { 
      title: "IPS Weld-On PVC 100 Solvent Cement", 
      description: "High-strength solvent cement for PVC pipes and fittings.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Accessories", 
      hsn: "35069999",
      features: ["High Strength", "Fast Bonding", "Suitable for SWR"],
      tableData: [
        { sizeCm: "50ml", sizeInch: "50ml", code: "M004901006", pkg: "48" },
        { sizeCm: "118ml", sizeInch: "118ml", code: "M004901011", pkg: "24" },
        { sizeCm: "237ml", sizeInch: "237ml", code: "M004901005", pkg: "24" },
        { sizeCm: "473ml", sizeInch: "473ml", code: "M004901010", pkg: "12" },
        { sizeCm: "946ml", sizeInch: "946ml", code: "M004901015", pkg: "12" },
      ]
    },
    { 
      title: "Astral P-70 Primer", 
      description: "Medium-bodied primer for preparing PVC pipes before solvent welding.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Accessories", 
      hsn: "35069999",
      features: ["Surface Preparation", "Enhanced Bond", "Medium Bodied"],
      tableData: [
        { sizeCm: "473ml", sizeInch: "473ml", code: "M008401005", pkg: "12" },
        { sizeCm: "946ml", sizeInch: "946ml", code: "M008401010", pkg: "12" },
      ]
    },
    { 
      title: "Astral uPVC 717 Heavy Bodied", 
      description: "Heavy-bodied solvent cement for large diameter uPVC and SWR pipes.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Accessories", 
      hsn: "35069999",
      features: ["Heavy Bodied", "Gap Filling", "Superior Strength"],
      tableData: [
        { sizeCm: "237ml", sizeInch: "237ml", code: "M008201007", pkg: "24" },
        { sizeCm: "473ml", sizeInch: "473ml", code: "M008201005", pkg: "12" },
        { sizeCm: "946ml", sizeInch: "946ml", code: "M008201010", pkg: "12" },
      ]
    },
    { 
      title: "Astral Pipefix PVC 101", 
      description: "Reliable solvent cement for PVC plumbing systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Accessories", 
      hsn: "35069999",
      features: ["Reliable Bonding", "Easy Application", "Cost Effective"],
      tableData: [
        { sizeCm: "50ml", sizeInch: "50ml", code: "M003606005", pkg: "48" },
        { sizeCm: "118ml", sizeInch: "118ml", code: "M003606010", pkg: "24" },
        { sizeCm: "237ml", sizeInch: "237ml", code: "M003606015", pkg: "24" },
        { sizeCm: "473ml", sizeInch: "473ml", code: "M003606020", pkg: "12" },
        { sizeCm: "946ml", sizeInch: "946ml", code: "M003606025", pkg: "12" },
      ]
    },
    // Birla UPVC Products
    {
      title: "Birla UPVC Pipe (SDR 11)",
      description: "Birla NU Leakproof UPVC pipes for cold water plumbing systems. Lead-free and UV stabilized for long-lasting performance.",
      image: "https://images.unsplash.com/photo-1581094288338-2314dddb7bc3?q=80&w=2070&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "UPVC Pipes & Fittings",
      hsn: "39172390",
      pressureRating: "SDR 11",
      features: ["Lead-Free", "UV Stabilized", "High Pressure Rating", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "BUP-001", pkg: "100" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "BUP-002", pkg: "50" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "BUP-003", pkg: "30" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "BUP-004", pkg: "20" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "BUP-005", pkg: "15" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "BUP-006", pkg: "10" },
      ]
    },
    {
      title: "Birla UPVC Elbow 90°",
      description: "Birla UPVC 90-degree elbow for directional changes in UPVC plumbing systems.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "UPVC Pipes & Fittings",
      hsn: "39174000",
      pressureRating: "High",
      features: ["Leak-Proof Joint", "Smooth Internal Flow", "Durable Construction"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "BUF-E90-01", pkg: "150" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "BUF-E90-02", pkg: "100" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "BUF-E90-03", pkg: "60" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "BUF-E90-04", pkg: "40" },
      ]
    },
    {
      title: "Birla UPVC Tee",
      description: "Birla UPVC equal tee for branching in cold water systems.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "UPVC Pipes & Fittings",
      hsn: "39174000",
      pressureRating: "High",
      features: ["Equal Branching", "High Impact Strength", "Easy Installation"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "BUF-T-01", pkg: "100" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "BUF-T-02", pkg: "80" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "BUF-T-03", pkg: "50" },
      ]
    },
    {
      title: "Birla UPVC Coupler",
      description: "Birla UPVC coupler for joining two UPVC pipes of the same diameter.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "UPVC Pipes & Fittings",
      hsn: "39174000",
      pressureRating: "High",
      features: ["Strong Bonding", "Chemical Resistant", "Long Service Life"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "BUF-C-01", pkg: "200" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "BUF-C-02", pkg: "150" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "BUF-C-03", pkg: "100" },
      ]
    },
    {
      title: "Birla UPVC Ball Valve",
      description: "Birla UPVC ball valve for flow control in UPVC plumbing networks.",
      image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=2070&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "UPVC Pipes & Fittings",
      hsn: "84818030",
      pressureRating: "High",
      features: ["Smooth Operation", "Leak-Free Seal", "High Durability"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "BUF-BV-01", pkg: "20" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "BUF-BV-02", pkg: "15" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "BUF-BV-03", pkg: "10" },
      ]
    },
    {
      title: "Birla UPVC Reducer",
      description: "Birla UPVC reducer for connecting pipes of different diameters.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "UPVC Pipes & Fittings",
      hsn: "39174000",
      pressureRating: "High",
      features: ["Precision Fit", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "2.0 x 1.5", sizeInch: "3/4\" x 1/2\"", code: "BUF-R-01", pkg: "100" },
        { sizeCm: "2.5 x 2.0", sizeInch: "1\" x 3/4\"", code: "BUF-R-02", pkg: "80" },
      ]
    },
    {
      title: "Birla UPVC End Cap",
      description: "Birla UPVC end cap for sealing the end of a UPVC pipe line.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "UPVC Pipes & Fittings",
      hsn: "39174000",
      pressureRating: "High",
      features: ["Leak-Proof Seal", "Easy to Install", "Durable"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "BUF-CAP-01", pkg: "200" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "BUF-CAP-02", pkg: "150" },
      ]
    },
    {
      title: "Birla UPVC MTA (Male Threaded Adaptor)",
      description: "Birla UPVC MTA for connecting UPVC pipes to threaded metal fittings.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "UPVC Pipes & Fittings",
      hsn: "39174000",
      pressureRating: "High",
      features: ["Precise Threads", "Strong Joint", "Lead-Free"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "BUF-MTA-01", pkg: "150" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "BUF-MTA-02", pkg: "100" },
      ]
    },
    {
      title: "Birla UPVC FTA (Female Threaded Adaptor)",
      description: "Birla UPVC FTA for connecting UPVC pipes to threaded male fittings.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "UPVC Pipes & Fittings",
      hsn: "39174000",
      pressureRating: "High",
      features: ["Leak-Proof Connection", "Robust Design", "Chemical Resistant"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "BUF-FTA-01", pkg: "150" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "BUF-FTA-02", pkg: "100" },
      ]
    },
    {
      title: "Birla UPVC Elbow 45°",
      description: "Birla UPVC 45-degree elbow for subtle directional changes in cold water systems.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "UPVC Pipes & Fittings",
      hsn: "39174000",
      pressureRating: "High",
      features: ["45-Degree Angle", "Smooth Flow", "Durable"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "BUF-E45-01", pkg: "150" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "BUF-E45-02", pkg: "100" },
      ]
    },
    {
      title: "Birla UPVC Union",
      description: "Birla UPVC union for easy disconnection of pipes in a UPVC plumbing system.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "UPVC Pipes & Fittings",
      hsn: "39174000",
      pressureRating: "High",
      features: ["Easy Maintenance", "Leak-Proof Seal", "High Quality"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "BUF-U-01", pkg: "50" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "BUF-U-02", pkg: "40" },
      ]
    },
    {
      title: "Birla UPVC Brass Elbow",
      description: "Birla UPVC elbow with brass threads for connecting to metal fixtures.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "UPVC Pipes & Fittings",
      hsn: "39174000",
      features: ["Brass Threads", "Secure Connection", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "BUF-BE-01", pkg: "50" },
        { sizeCm: "2.0 x 1.5", sizeInch: "3/4\" x 1/2\"", code: "BUF-BE-02", pkg: "50" },
      ]
    },
    {
      title: "Birla UPVC Brass Tee",
      description: "Birla UPVC tee with brass threads for branching to metal fixtures.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "UPVC Pipes & Fittings",
      hsn: "39174000",
      features: ["Brass Threads", "Robust Design", "Leak-Proof"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "BUF-BT-01", pkg: "40" },
        { sizeCm: "2.0 x 1.5", sizeInch: "3/4\" x 1/2\"", code: "BUF-BT-02", pkg: "40" },
      ]
    },
    {
      title: "Birla SWR Pushfit Pipe - Type B",
      description: "Birla SWR Pushfit Pipe Type B for soil, waste, and rainwater drainage. Manufactured as per IS:13592:2013.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39172390",
      features: ["Pushfit Jointing", "Leak-Proof", "Corrosion Resistant", "Type B - High Pressure"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "3 MTR S/S", code: "96000686", pkg: "01" },
        { sizeCm: "9.0", sizeInch: "3 MTR S/S", code: "96000687", pkg: "01" },
        { sizeCm: "11.0", sizeInch: "3 MTR S/S", code: "96000688", pkg: "01" },
        { sizeCm: "16.0", sizeInch: "3 MTR S/S", code: "96000689", pkg: "01" },
        { sizeCm: "7.5", sizeInch: "6 MTR S/S", code: "96000690", pkg: "01" },
        { sizeCm: "9.0", sizeInch: "6 MTR S/S", code: "96000691", pkg: "01" },
        { sizeCm: "11.0", sizeInch: "6 MTR S/S", code: "96000692", pkg: "01" },
        { sizeCm: "16.0", sizeInch: "6 MTR S/S", code: "96000693", pkg: "01" },
        { sizeCm: "7.5", sizeInch: "1.8 MTR S/S", code: "96000682", pkg: "01" },
        { sizeCm: "11.0", sizeInch: "1.8 MTR S/S", code: "96000684", pkg: "01" },
        { sizeCm: "7.5", sizeInch: "3.6 MTR S/S", code: "96000944", pkg: "01" },
        { sizeCm: "11.0", sizeInch: "3.6 MTR S/S", code: "96000945", pkg: "01" },
      ]
    },
    {
      title: "Birla SWR Solfit Pipe - Type B",
      description: "Birla SWR Solfit Pipe Type B for soil, waste, and rainwater drainage. Manufactured as per IS:13592:2013.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39172390",
      features: ["Solvent Cement Jointing", "Durable", "Chemical Resistant", "Type B - High Pressure"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "3 MTR S/S", code: "96000614", pkg: "01" },
        { sizeCm: "9.0", sizeInch: "3 MTR S/S", code: "96000615", pkg: "01" },
        { sizeCm: "11.0", sizeInch: "3 MTR S/S", code: "96000616", pkg: "01" },
        { sizeCm: "16.0", sizeInch: "3 MTR S/S", code: "96000617", pkg: "01" },
        { sizeCm: "7.5", sizeInch: "6 MTR S/S", code: "96000618", pkg: "01" },
        { sizeCm: "9.0", sizeInch: "6 MTR S/S", code: "96000619", pkg: "01" },
        { sizeCm: "11.0", sizeInch: "6 MTR S/S", code: "96000620", pkg: "01" },
        { sizeCm: "16.0", sizeInch: "6 MTR S/S", code: "96000621", pkg: "01" },
        { sizeCm: "7.5", sizeInch: "1.8 MTR S/S", code: "96000658", pkg: "01" },
        { sizeCm: "11.0", sizeInch: "1.8 MTR S/S", code: "96000660", pkg: "01" },
        { sizeCm: "7.5", sizeInch: "3.6 MTR S/S", code: "96000610", pkg: "01" },
        { sizeCm: "11.0", sizeInch: "3.6 MTR S/S", code: "96000612", pkg: "01" },
      ]
    },
    {
      title: "Birla SWR Solfit Pipe - Type A",
      description: "Birla SWR Solfit Pipe Type A for non-pressure applications. Manufactured as per IS:13592:2013.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39172390",
      features: ["Solvent Cement Jointing", "Lightweight", "Cost-Effective", "Type A - Soil & Waste"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "3 MTR S/S", code: "96000602", pkg: "01" },
        { sizeCm: "9.0", sizeInch: "3 MTR S/S", code: "96000603", pkg: "01" },
        { sizeCm: "11.0", sizeInch: "3 MTR S/S", code: "96000604", pkg: "01" },
        { sizeCm: "16.0", sizeInch: "3 MTR S/S", code: "96000605", pkg: "01" },
        { sizeCm: "7.5", sizeInch: "6 MTR S/S", code: "96000606", pkg: "01" },
        { sizeCm: "9.0", sizeInch: "6 MTR S/S", code: "96000607", pkg: "01" },
        { sizeCm: "11.0", sizeInch: "6 MTR S/S", code: "96000608", pkg: "01" },
        { sizeCm: "16.0", sizeInch: "6 MTR S/S", code: "96000609", pkg: "01" },
        { sizeCm: "7.5", sizeInch: "1.2 MTR D/S", code: "96000630", pkg: "01" },
        { sizeCm: "11.0", sizeInch: "1.2 MTR D/S", code: "96000632", pkg: "01" },
        { sizeCm: "7.5", sizeInch: "3.6 MTR S/S", code: "96000948", pkg: "01" },
        { sizeCm: "11.0", sizeInch: "3.6 MTR S/S", code: "96000949", pkg: "01" },
      ]
    },
    {
      title: "Birla SWR Pushfit Bend",
      description: "Birla SWR Pushfit Bend for directional changes in drainage systems. Manufactured as per IS:14735:1999.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Easy Installation", "Leak-Proof", "Smooth Interior"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "96000753", pkg: "50" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "96000441", pkg: "36" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "96000754", pkg: "18" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "96000755", pkg: "6" },
      ]
    },
    {
      title: "Birla SWR Pushfit Tee",
      description: "Birla SWR Pushfit Tee for branching in drainage systems. Manufactured as per IS:14735:1999.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Pushfit Jointing", "High Flow Rate", "Durable"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "96000810", pkg: "32" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "96000443", pkg: "24" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "96000811", pkg: "20" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "96000812", pkg: "6" },
      ]
    },
    {
      title: "Birla SWR Solfit Bend",
      description: "Birla SWR Solfit Bend for directional changes in drainage systems. Manufactured as per IS:14735:1999.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Solvent Jointing", "Strong Bond", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "96000749", pkg: "52" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "96000442", pkg: "36" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "96000750", pkg: "24" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "96001503", pkg: "14" },
      ]
    },
    {
      title: "Birla SWR Solfit Tee",
      description: "Birla SWR Solfit Tee for branching in drainage systems. Manufactured as per IS:14735:1999.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Solvent Jointing", "Reliable Performance", "Smooth Flow"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "96000806", pkg: "40" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "96000444", pkg: "24" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "96000807", pkg: "18" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "96001509", pkg: "9" },
      ]
    },
    {
      title: "Birla SWR Pushfit 45° Bend",
      description: "Birla SWR Pushfit 45° Bend for gradual directional changes in drainage systems. Manufactured as per IS:14735:1999.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["45-Degree Angle", "Pushfit Jointing", "Smooth Flow"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "96000746", pkg: "68" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "96000447", pkg: "36" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "96000747", pkg: "36" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "96000748", pkg: "12" },
      ]
    },
    {
      title: "Birla SWR Pushfit Elbow with Door",
      description: "Birla SWR Pushfit Elbow with Door for directional changes with access for cleaning. Manufactured as per IS:14735:1999.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Access Door", "Pushfit Jointing", "Easy Maintenance"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "96000756", pkg: "36" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "96000498", pkg: "30" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "96000757", pkg: "22" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "96000758", pkg: "8" },
      ]
    },
    {
      title: "Birla SWR Pushfit Coupler",
      description: "Birla SWR Pushfit Coupler for connecting two pipes of the same size. Manufactured as per IS:14735:1999.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Secure Jointing", "Pushfit Design", "Durable"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "96000768", pkg: "84" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "96000439", pkg: "69" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "96000769", pkg: "48" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "96000770", pkg: "12" },
      ]
    },
    {
      title: "Birla SWR Pushfit Repair Coupler",
      description: "Birla SWR Pushfit Repair Coupler for repairing damaged pipes in a drainage system. Manufactured as per IS:14735:1999.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Repair Solution", "Pushfit Jointing", "Leak-Proof"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "96000776", pkg: "84" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "96000777", pkg: "48" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "96000778", pkg: "12" },
      ]
    },
    {
      title: "Birla SWR Pushfit Reducer Coupler",
      description: "Birla SWR Pushfit Reducer Coupler for connecting pipes of different sizes. Manufactured as per IS:14735:1999.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Size Reduction", "Pushfit Jointing", "Smooth Flow"],
      tableData: [
        { sizeCm: "11.0x16.0", sizeInch: "4\"x6\"", code: "96000773", pkg: "16" },
        { sizeCm: "7.5x11.0", sizeInch: "2 1/2\"x4\"", code: "96000772", pkg: "32" },
      ]
    },
    {
      title: "Birla SWR Solfit 45° Bend",
      description: "Birla SWR Solfit 45° Bend for gradual directional changes in drainage systems. Manufactured as per IS:14735:1999.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["45-Degree Angle", "Solvent Jointing", "Strong Bond"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "96000744", pkg: "72" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "96000499", pkg: "64" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "96000745", pkg: "30" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "96001507", pkg: "12" },
      ]
    },
    {
      title: "Birla SWR Solfit Elbow with Door",
      description: "Birla SWR Solfit Elbow with Door for directional changes with access for cleaning. Manufactured as per IS:14735:1999.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Access Door", "Solvent Jointing", "Leak-Proof"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "96000751", pkg: "52" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "96000497", pkg: "30" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "96000752", pkg: "18" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "96001505", pkg: "12" },
      ]
    },
    {
      title: "Birla SWR Solfit Coupler",
      description: "Birla SWR Solfit Coupler for connecting two pipes of the same size. Manufactured as per IS:14735:1999.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Solvent Jointing", "Durable", "Secure Connection"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "96000766", pkg: "110" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "96000440", pkg: "75" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "96000767", pkg: "45" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "96001501", pkg: "18" },
      ]
    },
    {
      title: "Birla SWR Solfit Repair Coupler",
      description: "Birla SWR Solfit Repair Coupler for repairing damaged pipes in a drainage system. Manufactured as per IS:14735:1999.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Repair Solution", "Solvent Jointing", "Reliable"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "96000774", pkg: "110" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "96000775", pkg: "45" },
      ]
    },
    {
      title: "Birla SWR Solfit Reducer Coupler",
      description: "Birla SWR Solfit Reducer Coupler for connecting pipes of different sizes. Manufactured as per IS:14735:1999.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Size Reduction", "Solvent Jointing", "Smooth Interior"],
      tableData: [
        { sizeCm: "11.0x7.5", sizeInch: "4\"x2 1/2\"", code: "96000771", pkg: "36" },
        { sizeCm: "16.0x11.0", sizeInch: "6\"x4\"", code: "96000520", pkg: "33" },
      ]
    },
    {
      title: "Birla SWR Solfit Tee with Door",
      description: "Birla SWR Solfit Tee with Door for branching with access for cleaning. Manufactured as per IS:14735:1999.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Access Door", "Solvent Jointing", "Versatile"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "96000808", pkg: "32" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "96000500", pkg: "20" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "96000809", pkg: "18" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "96001513", pkg: "8" },
      ]
    },
    {
      title: "Birla SWR Solfit Reducing Tee",
      description: "Birla SWR Solfit Reducing Tee for branching to a smaller pipe size. Manufactured as per IS:14735:1999.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Size Reduction", "Solvent Jointing", "Efficient Flow"],
      tableData: [
        { sizeCm: "11.0x7.5", sizeInch: "4\"x2 1/2\"", code: "96000816", pkg: "18" },
        { sizeCm: "11.0x9.0", sizeInch: "4\"x3\"", code: "96000817", pkg: "20" },
        { sizeCm: "16.0x11.0", sizeInch: "6\"x4\"", code: "96001516", pkg: "11" },
      ]
    },
    {
      title: "Birla SWR Solfit Reducing Tee with Door",
      description: "Birla SWR Solfit Reducing Tee with Door for branching to a smaller pipe size with access. Manufactured as per IS:14735:1999.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Access Door", "Size Reduction", "Solvent Jointing"],
      tableData: [
        { sizeCm: "11.0x7.5", sizeInch: "4\"x2 1/2\"", code: "96000818", pkg: "18" },
        { sizeCm: "11.0x9.0", sizeInch: "4\"x3\"", code: "96000819", pkg: "15" },
        { sizeCm: "16.0x11.0", sizeInch: "6\"x4\"", code: "96001511", pkg: "10" },
      ]
    },
    {
      title: "Birla SWR Solfit Double Tee",
      description: "Birla SWR Solfit Double Tee for branching in two directions. Manufactured as per IS:14735:1999.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Double Branch", "Solvent Jointing", "Symmetrical Design"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "96000826", pkg: "32" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "96000827", pkg: "10" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "96002188", pkg: "6" },
      ]
    },
    {
      title: "Birla SWR Solfit Double Tee with Door",
      description: "Birla SWR Solfit Double Tee with Door for branching in two directions with access. Manufactured as per IS:14735:1999.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Access Door", "Double Branch", "Solvent Jointing"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "96000828", pkg: "32" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "96000829", pkg: "8" },
      ]
    },
    {
      title: "Birla SWR Solfit Swept Tee",
      description: "Birla SWR Solfit Swept Tee for smooth flow branching in drainage systems. Manufactured as per IS:14735:1999.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Swept Design", "Smooth Flow", "Solvent Jointing"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "96001984", pkg: "28" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "96001497", pkg: "18" },
      ]
    },
    {
      title: "Birla SWR Solfit Swept Tee with Door",
      description: "Birla SWR Solfit Swept Tee with Door for smooth flow branching with access. Manufactured as per IS:14735:1999.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Access Door", "Swept Design", "Solvent Jointing"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "96001983", pkg: "32" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "96001572", pkg: "13" },
      ]
    },
    {
      title: "Birla SWR Solfit Single Y",
      description: "Birla SWR Solfit Single Y for 45-degree branching in drainage systems. Manufactured as per IS:14735:1999.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["45-Degree Branch", "Solvent Jointing", "Efficient Drainage"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "96000840", pkg: "36" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "96001844", pkg: "24" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "96000841", pkg: "15" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "96000842", pkg: "4" },
        { sizeCm: "11.0x7.5", sizeInch: "4\"x2 1/2\"", code: "96000846", pkg: "15" },
      ]
    },
    {
      title: "Birla SWR Solfit Single Y with Door",
      description: "Birla SWR Solfit Single Y with Door for 45-degree branching with access. Manufactured as per IS:14735:1999.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Access Door", "45-Degree Branch", "Solvent Jointing"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "96000843", pkg: "24" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "96001844", pkg: "15" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "96000844", pkg: "10" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "96000845", pkg: "4" },
        { sizeCm: "11.0x7.5", sizeInch: "4\"x2 1/2\"", code: "96000847", pkg: "15" },
      ]
    },
    {
      title: "Birla SWR Solfit Double Y",
      description: "Birla SWR Solfit Double Y for 45-degree branching in two directions. Manufactured as per IS:14735:1999.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Double 45-Degree Branch", "Solvent Jointing", "High Capacity"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "96000852", pkg: "30" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "96000853", pkg: "10" },
      ]
    },
    {
      title: "Birla SWR Solfit Double Y with Door",
      description: "Birla SWR Solfit Double Y with Door for 45-degree branching in two directions with access. Manufactured as per IS:14735:1999.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Access Door", "Double 45-Degree Branch", "Solvent Jointing"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "96000854", pkg: "24" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "96000855", pkg: "6" },
      ]
    },
    {
      title: "Birla SWR Solfit Cleaning Pipe",
      description: "Birla SWR Solfit Cleaning Pipe for providing access to clean the drainage system. Manufactured as per IS:14735:1999.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Easy Access", "Solvent Jointing", "Maintenance Friendly"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "96000763", pkg: "42" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "96000764", pkg: "24" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "96000765", pkg: "6" },
      ]
    },
    {
      title: "Birla SWR 6\" Height Riser",
      description: "Birla SWR 6\" Height Riser for adjusting the height of floor traps and other fittings.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Height Adjustment", "Durable", "Easy Fit"],
      tableData: [
        { sizeCm: "11.0x5.0x4.0", sizeInch: "4\"x1 1/2\"x1 1/4\"", code: "96001812", pkg: "18" },
      ]
    },
    {
      title: "Birla SWR Reducing Bush",
      description: "Birla SWR Reducing Bush for connecting pipes of different diameters.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Size Reduction", "Secure Fit", "High Quality"],
      tableData: [
        { sizeCm: "11.0x7.5", sizeInch: "4\"x2 1/2\"", code: "96000759", pkg: "60" },
        { sizeCm: "16.0x11.0", sizeInch: "6\"x4\"", code: "96000760", pkg: "18" },
      ]
    },
    {
      title: "Birla SWR Vent Cowl",
      description: "Birla SWR Vent Cowl for protecting the vent pipe from debris and birds.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Vent Protection", "Weather Resistant", "Easy Installation"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "96000834", pkg: "160" },
        { sizeCm: "5.0", sizeInch: "1 1/2\"", code: "96001836", pkg: "528" },
        { sizeCm: "6.3", sizeInch: "2\"", code: "96001835", pkg: "300" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "96000835", pkg: "180" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "96001834", pkg: "35" },
      ]
    },
    {
      title: "Birla SWR Long P Trap",
      description: "Birla SWR Long P Trap for effective water sealing in drainage systems.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "SWR Traps",
      hsn: "39174000",
      features: ["Water Seal", "Odor Prevention", "Smooth Interior"],
      tableData: [
        { sizeCm: "11.0x11.0", sizeInch: "4\"x4\"", code: "96000789", pkg: "9" },
        { sizeCm: "11.0x12.5", sizeInch: "4\"x4 1/2\"", code: "96000791", pkg: "6" },
      ]
    },
    {
      title: "Birla SWR Short P Trap",
      description: "Birla SWR Short P Trap for compact water sealing solutions.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Traps",
      hsn: "39174000",
      features: ["Compact Design", "Effective Seal", "Durable"],
      tableData: [
        { sizeCm: "11.0x11.0", sizeInch: "4\"x4\"", code: "96000788", pkg: "9" },
        { sizeCm: "11.0x12.5", sizeInch: "4\"x4 1/2\"", code: "96000790", pkg: "6" },
      ]
    },
    {
      title: "Birla SWR S Trap",
      description: "Birla SWR S Trap for vertical drainage connections with water seal.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "SWR Traps",
      hsn: "39174000",
      features: ["Vertical Connection", "Strong Seal", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "11.0x11.0", sizeInch: "4\"x4\"", code: "96000801", pkg: "7" },
        { sizeCm: "11.0x12.5", sizeInch: "4\"x4 1/2\"", code: "96000802", pkg: "6" },
      ]
    },
    {
      title: "Birla SWR Q Trap",
      description: "Birla SWR Q Trap for specific drainage angles with water seal.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Traps",
      hsn: "39174000",
      features: ["Unique Angle", "Reliable Seal", "Smooth Flow"],
      tableData: [
        { sizeCm: "11.0x11.0", sizeInch: "4\"x4\"", code: "96000795", pkg: "9" },
        { sizeCm: "11.0x12.5", sizeInch: "4\"x4 1/2\"", code: "96000796", pkg: "6" },
      ]
    },
    {
      title: "Birla SWR Bell Mouth Trap",
      description: "Birla SWR Bell Mouth Trap for efficient floor drainage.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "SWR Traps",
      hsn: "39174000",
      features: ["Bell Mouth Design", "High Intake", "Easy Cleaning"],
      tableData: [
        { sizeCm: "11.0x7.5(S/F)", sizeInch: "4\"x2 1/2\"", code: "96000742", pkg: "10" },
        { sizeCm: "11.0x7.5(P/F)", sizeInch: "4\"x2 1/2\"", code: "96000743", pkg: "10" },
      ]
    },
    {
      title: "Birla SWR Floor Trap",
      description: "Birla SWR Floor Trap for collecting waste water from floors.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Traps",
      hsn: "39174000",
      features: ["Multi-Inlet", "Deep Seal", "Robust"],
      tableData: [
        { sizeCm: "11.0x7.5", sizeInch: "4\"x2 1/2\"", code: "96001852", pkg: "60" },
        { sizeCm: "11.0x6.3", sizeInch: "4\"x2\"", code: "96001853", pkg: "60" },
        { sizeCm: "11.0x5.0", sizeInch: "4\"x1 1/2\"", code: "96001854", pkg: "60" },
      ]
    },
    {
      title: "Birla SWR Multifloor Trap without Jali",
      description: "Birla SWR Multifloor Trap without Jali for versatile floor drainage setups.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "SWR Traps",
      hsn: "39174000",
      features: ["Versatile", "No Jali", "High Flow"],
      tableData: [
        { sizeCm: "11.0x7.5x5.0", sizeInch: "4\"x2 1/2\"x1 1/2\"", code: "96000785", pkg: "36" },
        { sizeCm: "11.0x7.5x5.0x4.0", sizeInch: "4\"x2 1/2\"x1 1/2\"x1 1/4\"", code: "96001491", pkg: "24" },
      ]
    },
    {
      title: "Birla SWR Gully Trap with Jali",
      description: "Birla SWR Gully Trap with Jali for outdoor drainage systems.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Traps",
      hsn: "39174000",
      features: ["With Jali", "Outdoor Use", "Heavy Duty"],
      tableData: [
        { sizeCm: "11.0", sizeInch: "4\"", code: "96001493", pkg: "8" },
      ]
    },
    {
      title: "Birla SWR Nahani Trap",
      description: "Birla SWR Nahani Trap for bathroom floor drainage.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "SWR Traps",
      hsn: "39174000",
      features: ["Traditional Design", "Effective Drainage", "Reliable"],
      tableData: [
        { sizeCm: "11.0x7.5", sizeInch: "4\"x2 1/2\"", code: "98000436", pkg: "52" },
      ]
    },
    {
      title: "Birla SWR Nahani Trap without Jali",
      description: "Birla SWR Nahani Trap without Jali for custom floor drainage installations.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Traps",
      hsn: "39174000",
      features: ["No Jali", "Customizable", "Strong Build"],
      tableData: [
        { sizeCm: "11.0x7.5", sizeInch: "4\"x2 1/2\" (3 ht)", code: "96000786", pkg: "31" },
        { sizeCm: "11.0x11.0", sizeInch: "4\"x4\" (3 ht)", code: "96000787", pkg: "30" },
      ]
    },
    {
      title: "Birla SWR 3\" Single Piece Nahani Trap",
      description: "Birla SWR 3\" Single Piece Nahani Trap for compact bathroom drainage.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "SWR Traps",
      hsn: "39174000",
      features: ["Single Piece", "Compact", "Efficient"],
      tableData: [
        { sizeCm: "11.0x11.0", sizeInch: "4\"x4\"", code: "96001486", pkg: "36" },
        { sizeCm: "11.0x7.5", sizeInch: "4\"x2 1/2\"", code: "96001487", pkg: "36" },
        { sizeCm: "11.0x9.0", sizeInch: "4\"x3\"", code: "96001488", pkg: "33" },
        { sizeCm: "11.0x6.3", sizeInch: "4\"x2\"", code: "96001687", pkg: "40" },
      ]
    },
    {
      title: "Birla SWR Door Cap",
      description: "Birla SWR Door Cap for sealing door openings in fittings.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Accessories",
      hsn: "39174000",
      features: ["Leak Proof", "Easy to Open", "Durable"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "96000779", pkg: "100" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "96000780", pkg: "50" },
      ]
    },
    {
      title: "Birla SWR Socket Plug",
      description: "Birla SWR Socket Plug for temporary or permanent sealing of pipe ends.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "SWR Accessories",
      hsn: "39174000",
      features: ["Tight Seal", "Multiple Sizes", "High Quality"],
      tableData: [
        { sizeCm: "4.0", sizeInch: "1 1/4\"", code: "96001707", pkg: "1000" },
        { sizeCm: "5.0", sizeInch: "1 1/2\"", code: "96001118", pkg: "800" },
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "96000803", pkg: "300" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "96000804", pkg: "150" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "96000805", pkg: "40" },
      ]
    },
    {
      title: "Birla SWR Clean Out Plug",
      description: "Birla SWR Clean Out Plug for easy access to drainage lines for cleaning.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Accessories",
      hsn: "39174000",
      features: ["Easy Access", "Threaded Design", "Durable"],
      tableData: [
        { sizeCm: "11.0", sizeInch: "4\"", code: "96001500", pkg: "100" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "96001499", pkg: "40" },
      ]
    },
    {
      title: "Birla SWR Pipe Clip",
      description: "Birla SWR Pipe Clip for secure mounting of pipes to walls or ceilings.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "SWR Accessories",
      hsn: "39174000",
      features: ["Strong Grip", "Easy Mounting", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "96000792", pkg: "300" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "96000793", pkg: "200" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "96000794", pkg: "100" },
      ]
    },
    {
      title: "Birla SWR Eva Pan Connector",
      description: "Birla SWR Eva Pan Connector for connecting WC pans to the drainage system.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Accessories",
      hsn: "39174000",
      features: ["Flexible", "Leak Proof", "Easy Fit"],
      tableData: [
        { sizeCm: "12.5x11.0 (Straight)", sizeInch: "5\"x4\"", code: "98000587", pkg: "20" },
        { sizeCm: "12.5x11.0 (18mm Offset)", sizeInch: "5\"x4\"", code: "98000602", pkg: "20" },
        { sizeCm: "12.5x11.0 (40mm Offset)", sizeInch: "5\"x4\"", code: "98000603", pkg: "20" },
      ]
    },
    {
      title: "Birla SWR Jali",
      description: "Birla SWR Jali for floor traps and drainage openings.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "SWR Accessories",
      hsn: "39174000",
      features: ["Debris Filtering", "Durable", "Easy to Clean"],
      tableData: [
        { sizeCm: "16.0x16.0 (Square)", sizeInch: "6\"x6\"", code: "96000782", pkg: "100" },
        { sizeCm: "11.0 (Round)", sizeInch: "4\"", code: "96000781", pkg: "200" },
      ]
    },
    {
      title: "Birla SWR Co-Moulding Rubber Seal Ring",
      description: "Birla SWR Co-Moulding Rubber Seal Ring for leak-proof pushfit connections.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Accessories",
      hsn: "40169320",
      features: ["High Elasticity", "Chemical Resistant", "Long Lasting"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "96000797", pkg: "1000" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "96000798", pkg: "1000" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "96000799", pkg: "1000" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "96000800", pkg: "500" },
      ]
    },
    {
      title: "Birla SWR Solvent Cement",
      description: "Birla SWR Solvent Cement for strong and permanent bonding of SWR pipes and fittings.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "SWR Accessories",
      hsn: "35069190",
      features: ["Fast Setting", "High Strength", "Leak Proof"],
      tableData: [
        { sizeCm: "100ml", sizeInch: "-", code: "98001276", pkg: "100" },
        { sizeCm: "250ml", sizeInch: "-", code: "98001277", pkg: "60" },
        { sizeCm: "500ml", sizeInch: "-", code: "98001278", pkg: "30" },
        { sizeCm: "1000ml", sizeInch: "-", code: "98001279", pkg: "15" },
      ]
    },
    {
      title: "Birla SWR Rubber Lubricant",
      description: "Birla SWR Rubber Lubricant for easy installation of pushfit pipes and fittings.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Accessories",
      hsn: "34039900",
      features: ["Easy Assembly", "Safe for Rubber", "Non-Toxic"],
      tableData: [
        { sizeCm: "100g", sizeInch: "-", code: "98001280", pkg: "100" },
        { sizeCm: "250g", sizeInch: "-", code: "98001282", pkg: "60" },
        { sizeCm: "500g", sizeInch: "-", code: "98001281", pkg: "30" },
      ]
    },
    {
      title: "Birla SWR Reducing Single Y",
      description: "Birla SWR Reducing Single Y for connecting pipes of different diameters at a 45° angle.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Size Reduction", "45° Branch", "Smooth Interior"],
      tableData: [
        { sizeCm: "11.0x7.5", sizeInch: "4\"x2 1/2\"", code: "96000838", pkg: "20" },
        { sizeCm: "16.0x11.0", sizeInch: "6\"x4\"", code: "96000839", pkg: "6" },
      ]
    },
    {
      title: "Birla SWR Reducing Single Y with Door",
      description: "Birla SWR Reducing Single Y with Door for connecting pipes of different diameters with access.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Access Door", "Size Reduction", "Leak Proof"],
      tableData: [
        { sizeCm: "11.0x7.5", sizeInch: "4\"x2 1/2\"", code: "96000843", pkg: "16" },
      ]
    },
    {
      title: "Birla SWR Reducing Double Y",
      description: "Birla SWR Reducing Double Y for multiple connections with size reduction.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Double Branch", "Size Reduction", "High Flow"],
      tableData: [
        { sizeCm: "11.0x7.5", sizeInch: "4\"x2 1/2\"", code: "96000844", pkg: "12" },
      ]
    },
    {
      title: "Birla SWR Reducing Double Y with Door",
      description: "Birla SWR Reducing Double Y with Door for multiple connections with access and size reduction.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Access Door", "Double Branch", "Size Reduction"],
      tableData: [
        { sizeCm: "11.0x7.5", sizeInch: "4\"x2 1/2\"", code: "96000845", pkg: "10" },
      ]
    },
    {
      title: "Birla SWR Swept Tee",
      description: "Birla SWR Swept Tee for smooth 90° branch connections.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Swept Design", "Smooth Flow", "Durable"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "96000846", pkg: "40" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "96000847", pkg: "18" },
      ]
    },
    {
      title: "Birla SWR Reducing Swept Tee",
      description: "Birla SWR Reducing Swept Tee for smooth 90° branch connections with size reduction.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "SWR Pipe Fittings",
      hsn: "39174000",
      features: ["Swept Design", "Size Reduction", "High Flow"],
      tableData: [
        { sizeCm: "11.0x7.5", sizeInch: "4\"x2 1/2\"", code: "96000848", pkg: "25" },
      ]
    },
    { 
      title: "Birla Pressure Pipe - 4kg (Class 2)", 
      description: "Birla NU Leakproof Pressure Pipes for agriculture and water supply systems. Class 2 (4 KGF/CM²) as per IS 4985:2021.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "4kg",
      features: ["TruFIT Technology", "Corrosion Resistant", "High Strength", "UV Stabilized", "Lead Free", "Smooth Inner Surface"],
      tableData: [
        { sizeCm: "63", sizeInch: "2\"", code: "96000856", pkg: "01" },
        { sizeCm: "75", sizeInch: "2 1/2\"", code: "96000857", pkg: "01" },
        { sizeCm: "90", sizeInch: "3\"", code: "96000858", pkg: "01" },
        { sizeCm: "110", sizeInch: "4\"", code: "96000859", pkg: "01" },
        { sizeCm: "140", sizeInch: "5\"", code: "96001290", pkg: "01" },
        { sizeCm: "160", sizeInch: "6\"", code: "96000860", pkg: "01" },
        { sizeCm: "200", sizeInch: "8\"", code: "96001291", pkg: "01" },
        { sizeCm: "250", sizeInch: "10\"", code: "96001822", pkg: "01" },
        { sizeCm: "315", sizeInch: "12\"", code: "96001821", pkg: "01" },
      ]
    },
    { 
      title: "Birla Pressure Pipe - 6kg (Class 3)", 
      description: "Birla NU Leakproof Pressure Pipes for agriculture and water supply systems. Class 3 (6 KGF/CM²) as per IS 4985:2021.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["TruFIT Technology", "Corrosion Resistant", "High Strength", "UV Stabilized", "Lead Free", "Smooth Inner Surface"],
      tableData: [
        { sizeCm: "40", sizeInch: "1 1/4\"", code: "96000871", pkg: "01" },
        { sizeCm: "50", sizeInch: "1 1/2\"", code: "96000872", pkg: "01" },
        { sizeCm: "63", sizeInch: "2\"", code: "96000873", pkg: "01" },
        { sizeCm: "75", sizeInch: "2 1/2\"", code: "96000874", pkg: "01" },
        { sizeCm: "90", sizeInch: "3\"", code: "96000875", pkg: "01" },
        { sizeCm: "110", sizeInch: "4\"", code: "96000876", pkg: "01" },
        { sizeCm: "140", sizeInch: "5\"", code: "96001294", pkg: "01" },
        { sizeCm: "160", sizeInch: "6\"", code: "96000877", pkg: "01" },
        { sizeCm: "200", sizeInch: "8\"", code: "96001295", pkg: "01" },
        { sizeCm: "250", sizeInch: "10\"", code: "96001735", pkg: "01" },
        { sizeCm: "315", sizeInch: "12\"", code: "96001737", pkg: "01" },
      ]
    },
    { 
      title: "Astral SWR Pipe - 4kg", 
      description: "Astral SWR Pipe with 4kg pressure rating for specialized drainage applications.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      pressureRating: "4kg",
      features: ["High Strength", "Leak-Proof", "UV Stabilized", "Long Life"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "A4KG075", pkg: "01" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "A4KG090", pkg: "01" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "A4KG110", pkg: "01" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "A4KG160", pkg: "01" },
      ]
    },
    { 
      title: "Astral SWR Pipe - 6kg", 
      description: "Astral SWR Pipe with 6kg pressure rating for high-pressure drainage applications.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "SWR Pipe Fittings", 
      pressureRating: "6kg",
      features: ["High Strength", "Leak-Proof", "UV Stabilized", "Long Life"],
      tableData: [
        { sizeCm: "7.5", sizeInch: "2 1/2\"", code: "A6KG075", pkg: "01" },
        { sizeCm: "9.0", sizeInch: "3\"", code: "A6KG090", pkg: "01" },
        { sizeCm: "11.0", sizeInch: "4\"", code: "A6KG110", pkg: "01" },
        { sizeCm: "16.0", sizeInch: "6\"", code: "A6KG160", pkg: "01" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Elbow (Class 2)", 
      description: "Birla Class 2 (4 KGF/CM²) Elbow for pressure piping systems. High durability and leak-proof design.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "4kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "63", sizeInch: "2\"", code: "96001470", pkg: "63" },
        { sizeCm: "75", sizeInch: "2 1/2\"", code: "96001472", pkg: "66" },
        { sizeCm: "90", sizeInch: "3\"", code: "96001476", pkg: "41" },
        { sizeCm: "110", sizeInch: "4\"", code: "96001478", pkg: "35" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Elbow 45° (Class 2)", 
      description: "Birla Class 2 (4 KGF/CM²) 45 Degree Elbow for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "4kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "63", sizeInch: "2\"", code: "96001994", pkg: "72" },
        { sizeCm: "90", sizeInch: "3\"", code: "96001995", pkg: "40" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Reducing Elbow (Class 2)", 
      description: "Birla Class 2 (4 KGF/CM²) Reducing Elbow for connecting pipes of different diameters in pressure systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "4kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "75x63", sizeInch: "2 1/2\"x2\"", code: "96002081", pkg: "80" },
        { sizeCm: "90x63", sizeInch: "3\"x2\"", code: "96002071", pkg: "50" },
        { sizeCm: "90x75", sizeInch: "3\"x2 1/2\"", code: "96002121", pkg: "50" },
        { sizeCm: "110x63", sizeInch: "4\"x2\"", code: "96002120", pkg: "30" },
        { sizeCm: "110x75", sizeInch: "4\"x2 1/2\"", code: "96002119", pkg: "30" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Elbow with Door (Class 2)", 
      description: "Birla Class 2 (4 KGF/CM²) Elbow with Door for easy maintenance and inspection.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "4kg",
      features: ["Easy Maintenance", "Leak Proof", "High Strength"],
      tableData: [
        { sizeCm: "63", sizeInch: "2\"", code: "96002068", pkg: "45" },
        { sizeCm: "75", sizeInch: "2 1/2\"", code: "96001473", pkg: "55" },
        { sizeCm: "90", sizeInch: "3\"", code: "96001479", pkg: "20" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Equal Tee (Class 2)", 
      description: "Birla Class 2 (4 KGF/CM²) Equal Tee for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "4kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "63", sizeInch: "2\"", code: "96001471", pkg: "78" },
        { sizeCm: "75", sizeInch: "2 1/2\"", code: "96001474", pkg: "48" },
        { sizeCm: "90", sizeInch: "3\"", code: "96001477", pkg: "29" },
        { sizeCm: "110", sizeInch: "4\"", code: "96001480", pkg: "15" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Tee with Door (Class 2)", 
      description: "Birla Class 2 (4 KGF/CM²) Tee with Door for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "4kg",
      features: ["Easy Maintenance", "Leak Proof", "High Strength"],
      tableData: [
        { sizeCm: "63", sizeInch: "2\"", code: "96002069", pkg: "30" },
        { sizeCm: "75", sizeInch: "2 1/2\"", code: "96001475", pkg: "35" },
        { sizeCm: "110", sizeInch: "4\"", code: "96001481", pkg: "13" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Fab Coupler (Class 2)", 
      description: "Birla Class 2 (4 KGF/CM²) Fabricated Coupler for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "4kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "90", sizeInch: "3\"", code: "96001314", pkg: "36" },
        { sizeCm: "110", sizeInch: "4\"", code: "96001316", pkg: "20" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Reducing Tee (Class 2)", 
      description: "Birla Class 2 (4 KGF/CM²) Reducing Tee for connecting pipes of different diameters in pressure systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "4kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "90x63", sizeInch: "3\"x2\"", code: "96002052", pkg: "28" },
        { sizeCm: "90x75", sizeInch: "3\"x2 1/2\"", code: "96002053", pkg: "28" },
        { sizeCm: "110x40", sizeInch: "4\"x1 1/4\"", code: "96002054", pkg: "30" },
        { sizeCm: "110x50", sizeInch: "4\"x1 1/2\"", code: "96002055", pkg: "30" },
        { sizeCm: "110x63", sizeInch: "4\"x2\"", code: "96001532", pkg: "20" },
        { sizeCm: "110x75", sizeInch: "4\"x2 1/2\"", code: "96001485", pkg: "18" },
        { sizeCm: "110x90", sizeInch: "4\"x3\"", code: "96001483", pkg: "17" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Reducing Tee with Door (Class 2)", 
      description: "Birla Class 2 (4 KGF/CM²) Reducing Tee with Door for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "4kg",
      features: ["Easy Maintenance", "Leak Proof", "High Strength"],
      tableData: [
        { sizeCm: "110x75", sizeInch: "4\"x2 1/2\"", code: "96001484", pkg: "15" },
        { sizeCm: "110x90", sizeInch: "4\"x3\"", code: "96001482", pkg: "13" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Reducing Y (Class 2)", 
      description: "Birla Class 2 (4 KGF/CM²) Reducing Y for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "4kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "110x63", sizeInch: "4\"x2\"", code: "96001535", pkg: "24" },
        { sizeCm: "110x75", sizeInch: "4\"x2 1/2\"", code: "96001536", pkg: "24" },
        { sizeCm: "110x90", sizeInch: "4\"x3\"", code: "96001537", pkg: "20" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Fab. Bend (Class 2)", 
      description: "Birla Class 2 (4 KGF/CM²) Fabricated Bend for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "4kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "63", sizeInch: "2\"", code: "96001698", pkg: "20" },
        { sizeCm: "75", sizeInch: "2 1/2\"", code: "96001699", pkg: "15" },
        { sizeCm: "90", sizeInch: "3\"", code: "96001700", pkg: "5" },
        { sizeCm: "110", sizeInch: "4\"", code: "96001701", pkg: "10" },
        { sizeCm: "140", sizeInch: "5\"", code: "96001702", pkg: "4" },
        { sizeCm: "160", sizeInch: "6\"", code: "96001703", pkg: "3" },
        { sizeCm: "180", sizeInch: "7\"", code: "96001704", pkg: "2" },
        { sizeCm: "200", sizeInch: "8\"", code: "96001705", pkg: "2" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Elbow (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Elbow for pressure piping systems. High durability and leak-proof design.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "63", sizeInch: "2\"", code: "96000901", pkg: "48" },
        { sizeCm: "75", sizeInch: "2 1/2\"", code: "96000902", pkg: "46" },
        { sizeCm: "90", sizeInch: "3\"", code: "96000903", pkg: "32" },
        { sizeCm: "110", sizeInch: "4\"", code: "96000904", pkg: "20" },
        { sizeCm: "160", sizeInch: "6\"", code: "96000905", pkg: "8" },
        { sizeCm: "200", sizeInch: "8\"", code: "96001716", pkg: "5" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Elbow 45° (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) 45 Degree Elbow for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "40", sizeInch: "1 1/4\"", code: "96001842", pkg: "170" },
        { sizeCm: "50", sizeInch: "1 1/2\"", code: "96001843", pkg: "120" },
        { sizeCm: "63", sizeInch: "2\"", code: "96000894", pkg: "72" },
        { sizeCm: "75", sizeInch: "2 1/2\"", code: "96000895", pkg: "92" },
        { sizeCm: "90", sizeInch: "3\"", code: "96000896", pkg: "140" },
        { sizeCm: "110", sizeInch: "4\"", code: "96000897", pkg: "232" },
        { sizeCm: "160", sizeInch: "6\"", code: "96000898", pkg: "733" },
        { sizeCm: "200", sizeInch: "8\"", code: "96002070", pkg: "1940" },
        { sizeCm: "250", sizeInch: "10\"", code: "96001960", pkg: "3443" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Elbow Double Socket (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Elbow Double Socket for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "63", sizeInch: "2\"", code: "96001464", pkg: "108" },
        { sizeCm: "75", sizeInch: "2 1/2\"", code: "96001432", pkg: "76" },
        { sizeCm: "90", sizeInch: "3\"", code: "96001437", pkg: "50" },
        { sizeCm: "110", sizeInch: "4\"", code: "96001427", pkg: "35" },
        { sizeCm: "140", sizeInch: "5\"", code: "96001467", pkg: "18" },
        { sizeCm: "160", sizeInch: "6\"", code: "96001460", pkg: "8" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Tee (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Tee for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "63", sizeInch: "2\"", code: "96000935", pkg: "70" },
        { sizeCm: "75", sizeInch: "2 1/2\"", code: "96000936", pkg: "40" },
        { sizeCm: "90", sizeInch: "3\"", code: "96000937", pkg: "24" },
        { sizeCm: "110", sizeInch: "4\"", code: "96000938", pkg: "14" },
        { sizeCm: "160", sizeInch: "6\"", code: "96000939", pkg: "5" },
        { sizeCm: "200", sizeInch: "8\"", code: "96001717", pkg: "2" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Equal Tee Double Socket (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Equal Tee Double Socket for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "63", sizeInch: "2\"", code: "96001465", pkg: "83" },
        { sizeCm: "75", sizeInch: "2 1/2\"", code: "96001433", pkg: "50" },
        { sizeCm: "90", sizeInch: "3\"", code: "96001438", pkg: "36" },
        { sizeCm: "110", sizeInch: "4\"", code: "96001428", pkg: "30" },
        { sizeCm: "140", sizeInch: "5\"", code: "96001468", pkg: "24" },
        { sizeCm: "160", sizeInch: "6\"", code: "96001461", pkg: "8" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Reducing Tee (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Reducing Tee for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "50x25", sizeInch: "1 1/2\"x3/4\"", code: "96002059", pkg: "114" },
        { sizeCm: "50x32", sizeInch: "1 1/2\"x1\"", code: "96002058", pkg: "114" },
        { sizeCm: "75x63", sizeInch: "2 1/2\"x2\"", code: "98000533", pkg: "70" },
        { sizeCm: "90x75", sizeInch: "3\"x2 1/2\"", code: "98000534", pkg: "40" },
        { sizeCm: "160x63", sizeInch: "6\"x2\"", code: "96001538", pkg: "12" },
        { sizeCm: "160x75", sizeInch: "6\"x2 1/2\"", code: "96001539", pkg: "12" },
        { sizeCm: "160x90", sizeInch: "6\"x3\"", code: "96001540", pkg: "11" },
        { sizeCm: "160x110", sizeInch: "6\"x4\"", code: "96001541", pkg: "9" },
        { sizeCm: "200x160", sizeInch: "8\"x6\"", code: "96001718", pkg: "3" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Reducing Cross Tee (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Reducing Cross Tee for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "63x40", sizeInch: "2\"x1 1/4\"", code: "96001996", pkg: "70" },
        { sizeCm: "63x50", sizeInch: "2\"x1 1/2\"", code: "96001997", pkg: "72" },
        { sizeCm: "75x40", sizeInch: "2 1/2\"x1 1/4\"", code: "96002056", pkg: "0" },
        { sizeCm: "90x63", sizeInch: "3\"x2\"", code: "96001999", pkg: "28" },
        { sizeCm: "90x75", sizeInch: "3\"x2 1/2\"", code: "96001998", pkg: "28" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Coupler (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Coupler for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "63", sizeInch: "2\"", code: "96000914", pkg: "90" },
        { sizeCm: "75", sizeInch: "2 1/2\"", code: "96000915", pkg: "60" },
        { sizeCm: "90", sizeInch: "3\"", code: "96000916", pkg: "36" },
        { sizeCm: "110", sizeInch: "4\"", code: "96000917", pkg: "12" },
        { sizeCm: "160", sizeInch: "6\"", code: "96000918", pkg: "12" },
        { sizeCm: "200", sizeInch: "8\"", code: "96001715", pkg: "6" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Plain Coupler Double Socket (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Plain Coupler Double Socket for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "63", sizeInch: "2\"", code: "96001466", pkg: "105" },
        { sizeCm: "75", sizeInch: "2 1/2\"", code: "96001434", pkg: "75" },
        { sizeCm: "90", sizeInch: "3\"", code: "96001439", pkg: "93" },
        { sizeCm: "110", sizeInch: "4\"", code: "96001429", pkg: "45" },
        { sizeCm: "140", sizeInch: "5\"", code: "96001469", pkg: "24" },
        { sizeCm: "160", sizeInch: "6\"", code: "96001462", pkg: "24" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Reducer (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Reducer for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "40x20", sizeInch: "1 1/4\"x1/2\"", code: "96002048", pkg: "350" },
        { sizeCm: "40x25", sizeInch: "1 1/4\"x3/4\"", code: "96002049", pkg: "315" },
        { sizeCm: "40x32", sizeInch: "1 1/4\"x1\"", code: "96002057", pkg: "245" },
        { sizeCm: "50x25", sizeInch: "1 1/2\"x3/4\"", code: "96001841", pkg: "336" },
        { sizeCm: "50x32", sizeInch: "1 1/2\"x1\"", code: "96001840", pkg: "336" },
        { sizeCm: "63x50", sizeInch: "2\"x1 1/2\"", code: "96001739", pkg: "200" },
        { sizeCm: "75x50", sizeInch: "2 1/2\"x1 1/2\"", code: "96002046", pkg: "64" },
        { sizeCm: "75x63", sizeInch: "2 1/2\"x2\"", code: "96002045", pkg: "100" },
        { sizeCm: "90x50", sizeInch: "3\"x1 1/2\"", code: "96000926", pkg: "48" },
        { sizeCm: "90x63", sizeInch: "3\"x2\"", code: "96000927", pkg: "120" },
        { sizeCm: "90x75", sizeInch: "3\"x2 1/2\"", code: "96000928", pkg: "54" },
        { sizeCm: "110x63", sizeInch: "4\"x2\"", code: "96000929", pkg: "66" },
        { sizeCm: "110x75", sizeInch: "4\"x2 1/2\"", code: "96000930", pkg: "70" },
        { sizeCm: "110x90", sizeInch: "4\"x3\"", code: "96000931", pkg: "66" },
        { sizeCm: "160x110", sizeInch: "6\"x4\"", code: "96000932", pkg: "18" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Single Y (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Single Y for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "40", sizeInch: "1 1/4\"", code: "96001855", pkg: "120" },
        { sizeCm: "50", sizeInch: "1 1/2\"", code: "96001856", pkg: "60" },
        { sizeCm: "63", sizeInch: "2\"", code: "98001837", pkg: "32" },
        { sizeCm: "160", sizeInch: "6\"", code: "96001533", pkg: "5" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Reducing Y (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Reducing Y for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "160x110", sizeInch: "6\"x4\"", code: "96001534", pkg: "7" },
        { sizeCm: "200x160", sizeInch: "8\"x6\"", code: "96002080", pkg: "3" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Plastic FTA (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Plastic Female Threaded Adapter for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "40", sizeInch: "1 1/4\"", code: "96001816", pkg: "240" },
        { sizeCm: "50", sizeInch: "1 1/2\"", code: "96001817", pkg: "150" },
        { sizeCm: "63", sizeInch: "2\"", code: "96001548", pkg: "120" },
        { sizeCm: "75", sizeInch: "2 1/2\"", code: "96001547", pkg: "140" },
        { sizeCm: "90", sizeInch: "3\"", code: "96001545", pkg: "42" },
        { sizeCm: "110", sizeInch: "4\"", code: "96001546", pkg: "45" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Plastic MTA (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Plastic Male Threaded Adapter for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "63", sizeInch: "2\"", code: "96001550", pkg: "180" },
        { sizeCm: "75", sizeInch: "2 1/2\"", code: "96001549", pkg: "100" },
        { sizeCm: "90", sizeInch: "3\"", code: "96001543", pkg: "140" },
        { sizeCm: "110", sizeInch: "4\"", code: "96001544", pkg: "48" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Reducing Bush (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Reducing Bush for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "63x40", sizeInch: "2\"x1 1/4\"", code: "96000907", pkg: "180" },
        { sizeCm: "63x50", sizeInch: "2\"x1 1/2\"", code: "96000908", pkg: "200" },
        { sizeCm: "75x50", sizeInch: "2 1/2\"x1 1/2\"", code: "96000909", pkg: "112" },
        { sizeCm: "75x63", sizeInch: "2 1/2\"x2\"", code: "96000910", pkg: "112" },
        { sizeCm: "75x63", sizeInch: "2 1/2\"x2\"", code: "96000911", pkg: "132" },
        { sizeCm: "90x63", sizeInch: "3\"x2\"", code: "96001551", pkg: "90" },
        { sizeCm: "90x75", sizeInch: "3\"x2 1/2\"", code: "96001552", pkg: "90" },
        { sizeCm: "110x63", sizeInch: "4\"x2\"", code: "96001553", pkg: "56" },
        { sizeCm: "110x75", sizeInch: "4\"x2 1/2\"", code: "96001554", pkg: "56" },
        { sizeCm: "110x90", sizeInch: "4\"x3\"", code: "96001555", pkg: "56" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - End Cap (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) End Cap for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "63", sizeInch: "2\"", code: "96000921", pkg: "144" },
        { sizeCm: "75", sizeInch: "2 1/2\"", code: "96000922", pkg: "100" },
        { sizeCm: "90", sizeInch: "3\"", code: "96000923", pkg: "56" },
        { sizeCm: "110", sizeInch: "4\"", code: "96000924", pkg: "60" },
        { sizeCm: "160", sizeInch: "6\"", code: "96000925", pkg: "18" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Threaded End Cap (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Threaded End Cap for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "40", sizeInch: "1 1/4\"", code: "98002050", pkg: "230" },
        { sizeCm: "50", sizeInch: "1 1/2\"", code: "98002051", pkg: "220" },
        { sizeCm: "63", sizeInch: "2\"", code: "98000535", pkg: "200" },
        { sizeCm: "75", sizeInch: "2 1/2\"", code: "98000536", pkg: "150" },
        { sizeCm: "90", sizeInch: "3\"", code: "98000537", pkg: "150" },
        { sizeCm: "110", sizeInch: "4\"", code: "98000538", pkg: "50" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Service Saddle Clamp (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Service Saddle Clamp for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "63x20", sizeInch: "2\"x1/2\"", code: "98000521", pkg: "100" },
        { sizeCm: "63x25", sizeInch: "2\"x3/4\"", code: "98000522", pkg: "100" },
        { sizeCm: "63x32", sizeInch: "2\"x1\"", code: "98000523", pkg: "100" },
        { sizeCm: "75x20", sizeInch: "2 1/2\"x1/2\"", code: "98000524", pkg: "85" },
        { sizeCm: "75x25", sizeInch: "2 1/2\"x3/4\"", code: "98000525", pkg: "85" },
        { sizeCm: "75x32", sizeInch: "2 1/2\"x1\"", code: "98000526", pkg: "85" },
        { sizeCm: "90x20", sizeInch: "3\"x1/2\"", code: "98000527", pkg: "70" },
        { sizeCm: "90x25", sizeInch: "3\"x3/4\"", code: "98000528", pkg: "70" },
        { sizeCm: "90x32", sizeInch: "3\"x1\"", code: "98000529", pkg: "70" },
        { sizeCm: "110x20", sizeInch: "4\"x1/2\"", code: "98000530", pkg: "50" },
        { sizeCm: "110x25", sizeInch: "4\"x3/4\"", code: "98000531", pkg: "50" },
        { sizeCm: "110x32", sizeInch: "4\"x1\"", code: "98000532", pkg: "50" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Plain Tee Fab (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Plain Tee Fabricated for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "200", sizeInch: "8\"", code: "96001972", pkg: "4" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Equal Tee (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Equal Tee for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "20", sizeInch: "1/2\"", code: "96001519", pkg: "600" },
        { sizeCm: "25", sizeInch: "3/4\"", code: "96001523", pkg: "300" },
        { sizeCm: "32", sizeInch: "1\"", code: "96001525", pkg: "180" },
        { sizeCm: "40", sizeInch: "1 1/4\"", code: "96000933", pkg: "120" },
        { sizeCm: "50", sizeInch: "1 1/2\"", code: "96000934", pkg: "74" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Coupler (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Coupler for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "20", sizeInch: "1/2\"", code: "96001520", pkg: "1200" },
        { sizeCm: "25", sizeInch: "3/4\"", code: "96001531", pkg: "600" },
        { sizeCm: "32", sizeInch: "1\"", code: "96001528", pkg: "360" },
        { sizeCm: "40", sizeInch: "1 1/4\"", code: "96000912", pkg: "200" },
        { sizeCm: "50", sizeInch: "1 1/2\"", code: "96000913", pkg: "192" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Reducer (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Reducer for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: []
    },
    { 
      title: "Birla Pressure Fitting - Plastic FTA (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Plastic FTA for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "20", sizeInch: "1/2\"", code: "96001813", pkg: "800" },
        { sizeCm: "25", sizeInch: "3/4\"", code: "96001814", pkg: "800" },
        { sizeCm: "32", sizeInch: "1\"", code: "96001815", pkg: "450" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Plastic MTA (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Plastic MTA for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "20", sizeInch: "1/2\"", code: "96001964", pkg: "400" },
        { sizeCm: "25", sizeInch: "3/4\"", code: "96001965", pkg: "400" },
        { sizeCm: "32", sizeInch: "1\"", code: "96001979", pkg: "300" },
        { sizeCm: "40", sizeInch: "1 1/4\"", code: "96001978", pkg: "180" },
        { sizeCm: "50", sizeInch: "1 1/2\"", code: "96001986", pkg: "200" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - End Cap (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) End Cap for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "20", sizeInch: "1/2\"", code: "96001521", pkg: "2000" },
        { sizeCm: "25", sizeInch: "3/4\"", code: "96001527", pkg: "1200" },
        { sizeCm: "32", sizeInch: "1\"", code: "96001526", pkg: "720" },
        { sizeCm: "40", sizeInch: "1 1/4\"", code: "96000919", pkg: "400" },
        { sizeCm: "50", sizeInch: "1 1/2\"", code: "96000920", pkg: "220" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Reducing Tee (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Reducing Tee for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "40x25", sizeInch: "1 1/4\"x3/4\"", code: "96002044", pkg: "90" },
        { sizeCm: "40x32", sizeInch: "1 1/4\"x1\"", code: "96002043", pkg: "90" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Bush (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Bush for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "25x20", sizeInch: "3/4\"x1/2\"", code: "96002086", pkg: "500" },
        { sizeCm: "32x25", sizeInch: "1\"x3/4\"", code: "96002087", pkg: "600" },
        { sizeCm: "32x20", sizeInch: "1\"x1/2\"", code: "96002088", pkg: "-" },
        { sizeCm: "40x25", sizeInch: "1 1/4\"x3/4\"", code: "96002000", pkg: "350" },
        { sizeCm: "40x32", sizeInch: "1 1/4\"x1\"", code: "96002001", pkg: "400" },
        { sizeCm: "50x40", sizeInch: "1 1/2\"x1 1/4\"", code: "96000906", pkg: "250" },
        { sizeCm: "50x32", sizeInch: "1 1/2\"x1\"", code: "96002002", pkg: "180" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Plain R. Tee Fab (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Plain R. Tee Fabricated for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "32", sizeInch: "1\"", code: "96001970", pkg: "300" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Fab Coupler (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Fabricated Coupler for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "90", sizeInch: "3\"", code: "96001315", pkg: "36" },
        { sizeCm: "110", sizeInch: "4\"", code: "96001317", pkg: "20" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Single Y Fab (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Single Y Fabricated for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "200", sizeInch: "8\"", code: "96002183", pkg: "-" },
        { sizeCm: "315x315", sizeInch: "12x12\"", code: "96001954", pkg: "1" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Fab. Bend (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Fabricated Bend for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "40", sizeInch: "1 1/4\"", code: "96001688", pkg: "70" },
        { sizeCm: "50", sizeInch: "1 1/2\"", code: "96001689", pkg: "40" },
        { sizeCm: "63", sizeInch: "2\"", code: "96001690", pkg: "20" },
        { sizeCm: "75", sizeInch: "2 1/2\"", code: "96001691", pkg: "15" },
        { sizeCm: "90", sizeInch: "3\"", code: "96001692", pkg: "10" },
        { sizeCm: "110", sizeInch: "4\"", code: "96001693", pkg: "10" },
        { sizeCm: "140", sizeInch: "5\"", code: "96001694", pkg: "6" },
        { sizeCm: "160", sizeInch: "6\"", code: "96001695", pkg: "3" },
        { sizeCm: "180", sizeInch: "7\"", code: "96001696", pkg: "2" },
        { sizeCm: "200", sizeInch: "8\"", code: "96001697", pkg: "2" },
      ]
    },
    { 
      title: "Birla Pressure Fitting - Ball Valve (Class 3)", 
      description: "Birla Class 3 (6 KGF/CM²) Ball Valve for pressure piping systems.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Birla", 
      category: "Pressure Pipes & Fittings", 
      pressureRating: "6kg",
      features: ["Leak Proof", "High Strength", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "25", sizeInch: "3/4\"", code: "98000514", pkg: "66" },
        { sizeCm: "32", sizeInch: "1\"", code: "98000515", pkg: "40" },
        { sizeCm: "40", sizeInch: "1 1/4\"", code: "98000516", pkg: "25" },
        { sizeCm: "50", sizeInch: "1 1/2\"", code: "98000517", pkg: "16" },
        { sizeCm: "63", sizeInch: "2\"", code: "98000518", pkg: "12" },
        { sizeCm: "75", sizeInch: "2 1/2\"", code: "98000519", pkg: "8" },
      ]
    },
  ];

  const collections = ['All', ...Array.from(new Set(astralProducts.map(p => p.category)))];

  useEffect(() => {
    setSelectedSubCategory('All');
  }, [selectedCollection]);

  const filteredProducts = astralProducts.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCollection = selectedCollection === 'All' || product.category === selectedCollection;
    const matchesBrand = product.brand === selectedBrand;
    const matchesSize = selectedSize === 'All' || 
                        product.size === selectedSize || 
                        product.tableData?.some(row => row.sizeInch === selectedSize || row.sizeCm === selectedSize);
    const matchesPressure = selectedPressure === 'All' || product.pressureRating === selectedPressure;
    const matchesSubCategory = selectedSubCategory === 'All' || product.pressureRating === selectedSubCategory;
    return matchesSearch && matchesCollection && matchesBrand && matchesSize && matchesPressure && matchesSubCategory;
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
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-4">
              {selectedBrand} {selectedCollection === 'All' ? 'Premium Piping Solutions' : `${selectedCollection} Solutions`}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              {selectedBrand} {selectedCollection === 'All' ? 'Pipes & Fittings' : selectedCollection}
            </h1>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl">
              {selectedCollection === 'UPVC Pipes & Fittings' 
                ? `Explore our range of lead-free ${selectedBrand} UPVC pipes and fittings, designed for cold water plumbing systems with superior durability and pressure resistance.`
                : `Discover the complete range of high-performance ${selectedBrand} pipes and fittings. Engineered for superior performance and durability in all plumbing applications.`}
            </p>
            <button 
              onClick={onOpenQuote}
              className="bg-brand-orange text-white px-8 py-4 rounded-xl font-bold hover:bg-orange-600 transition-all flex items-center gap-2 shadow-lg shadow-brand-orange/20"
            >
              <Phone size={20} />
              Get Bulk Quote
            </button>
          </div>
          <div className="w-full md:w-1/3 aspect-square bg-blue-50 rounded-2xl overflow-hidden relative flex items-center justify-center p-8">
            <img 
              src="https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop" 
              alt="Astral Products" 
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </div>
        </div>

        {/* Brand Selector */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-12">
          {['Astral', 'Birla', 'Tirupati', 'Finolex', 'Supreme'].map((brand) => (
            <button
              key={brand}
              onClick={() => setSelectedBrand(brand)}
              className={`px-8 py-4 rounded-2xl font-bold transition-all border ${
                selectedBrand === brand 
                  ? 'bg-brand-orange border-brand-orange text-brand-dark shadow-xl shadow-brand-orange/20' 
                  : 'bg-white border-slate-200 text-slate-600 hover:border-brand-orange/50'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-row overflow-x-auto gap-2 pb-4 overscroll-x-contain [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-200 [&::-webkit-scrollbar-track]:rounded-full">
            {collections.map(collection => (
              <button
                key={collection}
                onClick={() => setSelectedCollection(collection)}
                className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                  selectedCollection === collection 
                    ? 'bg-blue-600 text-white shadow-md border-blue-600' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {collection}
              </button>
            ))}
          </div>

          {(selectedCollection === 'Pressure Pipes & Fittings' || selectedCollection === 'SWR Pipe Fittings') && (
            <div className="flex flex-row gap-2 mb-2">
              {['All', '4kg', '6kg'].map(sub => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubCategory(sub)}
                  className={`px-6 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    selectedSubCategory === sub 
                      ? 'bg-brand-orange text-brand-dark border-brand-orange shadow-sm' 
                      : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  {sub === 'All' ? 'All Types' : sub}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            <div className="relative w-full md:w-64">
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            </div>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600"
            >
              <option value="All">All Sizes</option>
              <option value='1/2"'>1/2"</option>
              <option value='3/4"'>3/4"</option>
              <option value='1"'>1"</option>
              <option value='1 1/4"'>1 1/4"</option>
              <option value='1 1/2"'>1 1/2"</option>
              <option value='2"'>2"</option>
              <option value="7.5cm">7.5cm</option>
              <option value="9.0cm">9.0cm</option>
              <option value="11.0cm">11.0cm</option>
            </select>
            <select
              value={selectedPressure}
              onChange={(e) => setSelectedPressure(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600"
            >
              <option value="All">All Pressure Ratings</option>
              <option value="Low">Low</option>
              <option value="High">High</option>
              <option value="SDR 11">SDR 11</option>
              <option value="SDR 13.5">SDR 13.5</option>
            </select>
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
              className="mt-6 text-blue-600 font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
