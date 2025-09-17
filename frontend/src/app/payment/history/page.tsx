'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, Download, Receipt, Calendar, DollarSign,
  Search, Filter, FileText, CreditCard, TrendingUp,
  Package, ChevronDown, ChevronUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { BRAND_CONFIG } from '@/shared/constants';
import { format } from 'date-fns';

interface Payment {
  id: string;
  title: string;
  company: string;
  amount: number;
  boardCount: number;
  status: string;
  date: string;
}

export default function PaymentHistoryPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      const response = await fetch('/api/payment/history', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setPayments(data);

      // Calculate totals
      const total = data.reduce((sum: number, p: Payment) => sum + (p.amount / 100), 0);
      setTotalSpent(total);
      setTotalJobs(data.length);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/payment/invoice/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${paymentId.substring(0, 8)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Invoice downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download invoice',
        variant: 'destructive',
      });
    }
  };

  const filteredPayments = payments.filter(payment =>
    payment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedPayments = filteredPayments.reduce((acc, payment) => {
    const month = format(new Date(payment.date), 'MMMM yyyy');
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(payment);
    return acc;
  }, {} as Record<string, Payment[]>);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Button
        onClick={() => router.push('/dashboard')}
        variant="ghost"
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Payment History</h1>
        <p className="text-gray-600">View and manage your billing history</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime spending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs Posted</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              Total job postings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Cost</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalJobs > 0 ? (totalSpent / totalJobs).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per job posting
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by job title or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Payment History */}
      {Object.keys(groupedPayments).length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No payments yet</h3>
            <p className="text-gray-600 mb-4">
              Your payment history will appear here after your first job posting
            </p>
            <Button
              onClick={() => router.push('/post-job')}
              style={{ backgroundColor: BRAND_CONFIG.colors.primary }}
            >
              Post Your First Job
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedPayments).map(([month, monthPayments]) => (
            <div key={month}>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {month}
              </h3>
              <div className="space-y-3">
                {monthPayments.map((payment) => (
                  <Card key={payment.id}>
                    <CardContent className="p-4">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setExpandedPayment(
                          expandedPayment === payment.id ? null : payment.id
                        )}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <h4 className="font-medium">{payment.title}</h4>
                              <p className="text-sm text-gray-600">{payment.company}</p>
                            </div>
                            <Badge variant="outline" className="ml-auto mr-4">
                              {payment.boardCount} boards
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold">${(payment.amount / 100).toFixed(2)}</p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(payment.date), 'MMM d, yyyy')}
                            </p>
                          </div>
                          {expandedPayment === payment.id ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedPayment === payment.id && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                            <div>
                              <span className="text-gray-600">Payment ID:</span>
                              <p className="font-mono text-xs mt-1">
                                {payment.id.substring(0, 20)}...
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Status:</span>
                              <Badge className="ml-2 bg-green-100 text-green-800">
                                Paid
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadInvoice(payment.id);
                              }}
                            >
                              <Download className="mr-1 h-3 w-3" />
                              Invoice
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/job/${payment.id}`);
                              }}
                            >
                              <FileText className="mr-1 h-3 w-3" />
                              View Job
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-3 text-right">
                <p className="text-sm text-gray-600">
                  Monthly total:{' '}
                  <span className="font-semibold">
                    ${monthPayments.reduce((sum, p) => sum + (p.amount / 100), 0).toFixed(2)}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}