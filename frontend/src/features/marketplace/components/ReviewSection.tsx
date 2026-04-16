"use client";

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface Review {
  _id: string;
  userName: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

interface ReviewSectionProps {
  productId?: string;
  shopName?: string;
}

export function ReviewSection({ productId, shopName }: ReviewSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReviews = async () => {
    try {
      const query = productId ? `productId=${productId}` : `shopName=${shopName}`;
      const res = await api.get<any>(`/reviews?${query}`);
      setReviews(res.data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId, shopName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Vui lòng đăng nhập để đánh giá");
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post("/reviews", {
        productId,
        shopName,
        rating: newRating,
        comment: newComment,
        userId: user.userId,
        userName: user.email.split('@')[0]
      });
      setNewComment("");
      setNewRating(5);
      fetchReviews();
    } catch (error) {
      alert("Lỗi khi gửi đánh giá");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-16 border-t border-gray-100 pt-12">
      <div className="flex items-center gap-3 mb-8">
        <MessageSquare className="w-6 h-6 text-indigo-600" />
        <h2 className="text-2xl font-bold tracking-tight">Đánh giá từ cộng đồng</h2>
      </div>

      {user && (
        <form onSubmit={handleSubmit} className="mb-12 bg-zinc-50 rounded-3xl p-6 border border-zinc-100">
          <p className="font-bold text-sm mb-4">Chia sẻ trải nghiệm của bạn</p>
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-6 h-6 cursor-pointer transition-colors ${star <= newRating ? "fill-amber-400 text-amber-400" : "text-zinc-300"}`}
                onClick={() => setNewRating(star)}
              />
            ))}
          </div>
          <textarea
            className="w-full bg-white border border-zinc-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px]"
            placeholder="Viết cảm nghĩ của bạn về sản phẩm/shop này..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="py-10 text-center text-zinc-400 font-medium">Đang tải đánh giá...</div>
      ) : reviews.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-zinc-200">
          <p className="text-zinc-400 font-medium">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review._id} className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold uppercase">
                    {review.userName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{review.userName}</span>
                      {review.isVerifiedPurchase && (
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> VERIFIED PURCHASE
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {format(new Date(review.createdAt), "dd/MM/yyyy")}
                    </span>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${star <= review.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-zinc-600 text-sm leading-relaxed">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
