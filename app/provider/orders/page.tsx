"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";

interface User {
	id: number;
	username?: string;
	phoneNumber?: string;
}

interface Offer {
	id: number;
	title?: string;
	images?: { path: string }[];
	pickupLocation?: string;
}

interface Order {
	id: number;
	quantity: number;
	offerId: number;
	userId: number;
	status: string;
	createdAt: string;
	user?: User;
	offer?: Offer;
}

const BASE_IMAGE_URL = process.env.NEXT_PUBLIC_BACKEND_URL + "/storage/";
const DEFAULT_IMAGE = "/logo.png";

const ProviderOrders = () => {
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchOrders = async () => {
		try {
			const token = localStorage.getItem("accessToken");
			if (!token) return (window.location.href = "/signIn");

			const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/provider`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			setOrders(res.data || []);
		} catch (err) {
			console.error(err);
			toast.error("Failed to fetch provider orders");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchOrders();
	}, []);

	const confirmed = orders.filter((o) => o.status === "confirmed");
	const pending = orders.filter((o) => o.status === "pending");
	const cancelled = orders.filter((o) => o.status === "cancelled");

	return (
		<main className="bg-[#cdeddf] min-h-screen pt-24 pb-20 flex flex-col items-center">
			<ToastContainer />

			<div className="w-full max-w-6xl px-4">
				<div className="w-full flex items-center justify-between mb-6 pt-6">
					<h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">Orders for your offers</h1>
				</div>

				<div className="mb-6 bg-white rounded-2xl shadow-sm p-4 flex flex-wrap gap-4">
					<div className="px-4 py-3 bg-[#F9FAF8] rounded-lg">
						<p className="text-sm text-gray-600">Total orders</p>
						<p className="text-xl font-bold text-gray-900">{orders.length}</p>
					</div>

					<div className="px-4 py-3 bg-white rounded-lg border">
						<p className="text-sm text-gray-600">Confirmed</p>
						<p className="text-xl font-bold text-emerald-600">{confirmed.length}</p>
					</div>

					<div className="px-4 py-3 bg-white rounded-lg border">
						<p className="text-sm text-gray-600">Pending</p>
						<p className="text-xl font-bold text-yellow-600">{pending.length}</p>
					</div>

					<div className="px-4 py-3 bg-white rounded-lg border">
						<p className="text-sm text-gray-600">Cancelled</p>
						<p className="text-xl font-bold text-red-600">{cancelled.length}</p>
					</div>
				</div>

				{loading ? (
					<p className="text-center text-gray-600">Loading orders...</p>
				) : orders.length === 0 ? (
					<p className="text-center text-gray-600">No orders for your offers yet.</p>
				) : (
					<div className="flex flex-col gap-6">
						{/* Confirmed */}
						{confirmed.length > 0 && (
							<section>
								<h2 className="text-xl font-semibold text-gray-700 mb-3">Confirmed</h2>
								<div className="flex flex-col">
									{confirmed.map((order) => (
										<OrderCard key={order.id} order={order} />
									))}
								</div>
							</section>
						)}

						{/* Pending */}
						{pending.length > 0 && (
							<section>
								<h2 className="text-xl font-semibold text-gray-700 mb-3">Pending</h2>
								<div className="flex flex-col">
									{pending.map((order) => (
										<OrderCard key={order.id} order={order} />
									))}
								</div>
							</section>
						)}

						{/* Cancelled */}
						{cancelled.length > 0 && (
							<section>
								<h2 className="text-xl font-semibold text-gray-700 mb-3">Cancelled</h2>
								<div className="flex flex-col">
									{cancelled.map((order) => (
										<OrderCard key={order.id} order={order} />
									))}
								</div>
							</section>
						)}
					</div>
				)}
			</div>
		</main>
	);
};

const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
	const offer = order.offer;
	const user = order.user;

	const statusClass = (s: string) => {
		switch (s) {
			case "pending":
				return "bg-yellow-100 text-yellow-800";
			case "confirmed":
				return "bg-emerald-100 text-emerald-800";
			case "cancelled":
				return "bg-red-100 text-red-700";
			default:
				return "bg-gray-100 text-gray-700";
		}
	};

	return (
		<div className="bg-white rounded-2xl shadow-md p-4 flex items-center gap-4 border border-gray-100">
			<div className="w-24 h-24 rounded-lg overflow-hidden relative flex-shrink-0">
				<Image
					src={offer?.images?.[0]?.path ? `${BASE_IMAGE_URL}${offer.images![0].path}` : DEFAULT_IMAGE}
					alt={offer?.title || "Offer image"}
					fill
					className="object-cover"
				/>
			</div>

			<div className="flex-1 min-w-0">
				<h3 className="text-lg font-semibold text-gray-900 truncate">{offer?.title || "Offer"}</h3>
				<p className="text-sm text-gray-600">Ordered by: <span className="font-medium text-gray-800">{user?.username || `User ${order.userId}`}</span></p>
				<p className="text-sm text-gray-500">Quantity: <span className="font-medium">{order.quantity}</span></p>
				<p className="text-sm text-gray-500">Ordered on: <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span></p>
			</div>

			<div className="flex flex-col items-end gap-2">
				<span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusClass(order.status)}`}>{order.status.toUpperCase()}</span>
			</div>
		</div>
	);
};

export default ProviderOrders;
