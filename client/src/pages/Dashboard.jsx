import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { LogOut, TrendingUp, TrendingDown, IndianRupee, Plus, Pencil, Trash2 } from 'lucide-react';

const COLORS = ['#10B981', '#EF4444', '#3B82F6']; // Green (Earn), Red (Spend), Blue (Invest)

export default function Dashboard() {
    const navigate = useNavigate();
    const [summary, setSummary] = useState({ earn: 0, spend: 0, invest: 0 });
    const [transactions, setTransactions] = useState([]);
    const [filters, setFilters] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ type: 'earn', amount: '', description: '', date: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) navigate('/');
        fetchData();
    }, [navigate, filters]);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        const queryParams = new URLSearchParams({
            month: filters.month,
            year: filters.year
        }).toString();

        try {
            const [summaryRes, transactionsRes] = await Promise.all([
                fetch(`https://satviksath.shop/api/summary?${queryParams}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`https://satviksath.shop/api/transactions?${queryParams}`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (summaryRes.ok) setSummary(await summaryRes.json());
            if (transactionsRes.ok) setTransactions(await transactionsRes.json());
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const url = editingId
            ? `https://satviksath.shop/api/transactions/${editingId}`
            : 'https://satviksath.shop/api/transactions';
        const method = editingId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setShowForm(false);
                setEditingId(null);
                setFormData({ type: 'earn', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
                fetchData();
            }
        } catch (error) {
            console.error('Error saving transaction:', error);
        }
    };

    const handleEdit = (transaction) => {
        setFormData({
            type: transaction.type,
            amount: transaction.amount,
            description: transaction.description,
            date: transaction.date
        });
        setEditingId(transaction.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        // if (!window.confirm('Are you sure you want to delete this transaction?')) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`https://satviksath.shop/api/transactions/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                fetchData();
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
        }
    };

    const chartData = [
        { name: 'Earned', value: summary.earn || 0 },
        { name: 'Spent', value: summary.spend || 0 },
        { name: 'Invested', value: summary.invest || 0 },
    ].filter(d => d.value > 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 font-sans">
            {/* Navbar */}
            <nav className="bg-white/80 backdrop-blur-md shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-10 border-b border-gray-100">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                    <IndianRupee className="w-8 h-8 text-indigo-600" /> Money Tracker
                </h1>
                <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 flex items-center gap-2 transition-colors font-medium">
                    <LogOut className="w-5 h-5" /> Logout
                </button>
            </nav>

            <main className="max-w-7xl mx-auto p-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl shadow-lg text-white transform transition hover:-translate-y-1">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-emerald-100 text-sm font-medium mb-1">Total Earned</p>
                                <p className="text-3xl font-bold">₹{summary.earn?.toLocaleString()}</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-6 rounded-2xl shadow-lg text-white transform transition hover:-translate-y-1">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-rose-100 text-sm font-medium mb-1">Total Spent</p>
                                <p className="text-3xl font-bold">₹{summary.spend?.toLocaleString()}</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                                <TrendingDown className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg text-white transform transition hover:-translate-y-1">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-blue-100 text-sm font-medium mb-1">Total Invested</p>
                                <p className="text-3xl font-bold">₹{summary.invest?.toLocaleString()}</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                                <IndianRupee className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white transform transition hover:-translate-y-1">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-violet-100 text-sm font-medium mb-1">Total Saving</p>
                                <p className="text-3xl font-bold">₹{((summary.earn || 0) - (summary.spend || 0)).toLocaleString()}</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                                <IndianRupee className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Chart Section */}
                    <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Overview</h3>
                        <div className="h-64 w-full">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">
                                    No data available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Transactions Section */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                {filters.month ? 'Monthly Transactions' : 'Yearly Transactions'}
                            </h3>

                            <div className="flex gap-2">
                                <select
                                    className="border rounded-md px-3 py-2 text-sm bg-gray-50"
                                    value={filters.month}
                                    onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                                >
                                    <option value="">All Months</option>
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className="border rounded-md px-3 py-2 text-sm bg-gray-50"
                                    value={filters.year}
                                    onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                                >
                                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={() => {
                                    setEditingId(null);
                                    setFormData({ type: 'earn', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
                                    setShowForm(!showForm);
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition shadow-md hover:shadow-lg"
                            >
                                <Plus className="w-4 h-4" /> {showForm ? 'Close' : 'Add New'}
                            </button>
                        </div>

                        {showForm && (
                            <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                        <select
                                            className="w-full px-3 py-2 border rounded-md"
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        >
                                            <option value="earn">Earn</option>
                                            <option value="spend">Spend</option>
                                            <option value="invest">Invest</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full px-3 py-2 border rounded-md"
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full px-3 py-2 border rounded-md"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border rounded-md"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-md text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                                    >
                                        {editingId ? 'Update Transaction' : 'Save Transaction'}
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wider">
                                        <th className="pb-3 font-semibold">Date</th>
                                        <th className="pb-3 font-semibold">Description</th>
                                        <th className="pb-3 font-semibold">Type</th>
                                        <th className="pb-3 font-semibold text-right">Amount</th>
                                        <th className="pb-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {transactions.map((t) => (
                                        <tr key={t.id} className="group hover:bg-gray-50 transition">
                                            <td className="py-4 text-sm text-gray-600">{t.date}</td>
                                            <td className="py-4 text-sm text-gray-800 font-medium">{t.description || '-'}</td>
                                            <td className="py-4 text-sm">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize
                                                    ${t.type === 'earn' ? 'bg-emerald-100 text-emerald-700' :
                                                        t.type === 'spend' ? 'bg-rose-100 text-rose-700' :
                                                            'bg-blue-100 text-blue-700'}`}>
                                                    {t.type}
                                                </span>
                                            </td>
                                            <td className={`py-4 text-sm font-bold text-right
                                                ${t.type === 'earn' ? 'text-emerald-600' :
                                                    t.type === 'spend' ? 'text-rose-600' :
                                                        'text-blue-600'}`}>
                                                {t.type === 'earn' ? '+' : '-'}₹{t.amount}
                                            </td>
                                            <td className="py-3 text-sm text-right">
                                                <button
                                                    onClick={() => handleEdit(t)}
                                                    className="text-blue-600 hover:text-blue-800 mx-2"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(t.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {transactions.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="py-8 text-center text-gray-400 text-sm">
                                                No transactions found. Start by adding one!
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
