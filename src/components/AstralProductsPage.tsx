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
  const [searchQuery, setSearchQuery] = useState('');
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
  ];

  const collections = ['All', ...Array.from(new Set(astralProducts.map(p => p.category)))];

  const filteredProducts = astralProducts.filter(product => {
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
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-4">
              Astral SWR Solutions
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Astral SWR Pipes & Fittings</h1>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl">
              Discover the complete range of Astral SWR (Soil, Waste & Rainwater) pipes and fittings. Engineered for superior drainage performance and durability.
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
