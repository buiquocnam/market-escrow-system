import { fetchShopifyProducts } from "@/features/marketplace/api/shopifyApi";
import { CheckoutButton } from "@/features/escrow/components/CheckoutButton";
import { ReviewSection } from "@/features/marketplace/components/ReviewSection";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const resolvedParams = await params;
  const response = await fetchShopifyProducts();
  const product = response.products.find((p) => p.handle === resolvedParams.handle);
   
  if (!product) {
    notFound();
  }
  
  return (
    <main className="min-h-screen bg-white pb-24 w-full">
      <div className="max-w-[1200px] mx-auto px-8 pt-6">
        {/* Breadcrumb */}
        <div className="text-[14px] text-[var(--palette-text-secondary)] mb-6 flex items-center gap-2">
           <Link href="/" className="hover:underline">Home</Link>
           <span>/</span>
           <span className="text-[var(--palette-text-primary)] font-medium">Marketplace Deals</span>
        </div>

        {/* 2-Column Layout */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          
          {/* Left Column - Gallery */}
          <div className="w-full lg:w-[60%]">
             <div className="w-full aspect-[4/3] bg-[var(--palette-grey100)] rounded-[var(--radius-large)] overflow-hidden shadow-sm relative">
                <img 
                  src={product.imageSrc} 
                  alt={product.title} 
                  className="w-full h-full object-cover" 
                />
             </div>
             
             {/* Divider */}
             <div className="w-full h-[1px] bg-[var(--palette-grey1000)] my-10" />

             {/* Description */}
             <div>
                 <h2 className="text-[22px] font-bold text-[var(--palette-text-primary)] mb-4 tracking-[-0.44px]">{product.title}</h2>
                 
                 {/* Tags Shopify */}
                 <div className="flex flex-wrap gap-2 mb-6">
                    {product.category && product.category !== "General" && (
                       <span className="px-3 py-1 bg-[var(--palette-grey100)] text-[var(--palette-text-primary)] text-sm font-semibold rounded-full border border-gray-200">
                         {product.category}
                       </span>
                    )}
                    {product.tags && product.tags.map(tag => (
                       <span key={tag} className="px-3 py-1 bg-white text-[var(--color-rausch)] text-sm font-medium rounded-full border border-[var(--color-rausch)]/30 shadow-sm">
                         #{tag}
                       </span>
                    ))}
                 </div>

                 <h3 className="text-[18px] font-bold text-[var(--palette-text-primary)] mb-3">About this item</h3>
                <div 
                   className="text-[16px] text-[var(--palette-text-secondary)] leading-[1.6] whitespace-pre-line"
                   dangerouslySetInnerHTML={{ __html: product.descriptionHtml || "This product matches its description precisely." }}
                />
             </div>
          </div>

          {/* Right Column - Booking / Action Box */}
          <div className="w-full lg:w-[40%] relative">
             <div className="sticky top-28 bg-white border border-[var(--palette-grey1000)] rounded-[var(--radius-large)] p-6 shadow-[var(--shadow-airbnb-card)]">
                
                {/* Price Header */}
                <div className="flex items-baseline gap-2 mb-6 border-b border-[var(--palette-grey1000)] pb-6">
                   <h2 className="text-[28px] font-bold tracking-tight">${product.priceUsd.toLocaleString()}</h2>
                   <span className="text-xl text-[var(--palette-text-secondary)]">≈ {product.ethPrice} ETH</span>
                </div>

                {/* Seller Info */}
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-md shadow-indigo-100">
                     {product.shopName?.charAt(0).toUpperCase()}
                   </div>
                   <div>
                     <Link href={`/shop/${product.shopName}`} className="font-bold text-[17px] text-gray-900 hover:text-indigo-600 transition-colors block">
                        {product.shopName}
                     </Link>
                     <p className="text-[12px] text-[var(--palette-text-secondary)] font-medium">Shopify Verified Partner</p>
                   </div>
                </div>

                {/* Checkout Action */}
                <CheckoutButton product={product} />
                <p className="text-center text-[12px] text-[var(--palette-text-secondary)] px-4 mt-4">
                   Your funds are locked in Ethereum Smart Contract until you confirm delivery. You will not be charged yet.
                </p>
             </div>
          </div>

        </div>
        
        <ReviewSection productId={product.id} shopName={product.shopName} />
      </div>
    </main>
  );
}
