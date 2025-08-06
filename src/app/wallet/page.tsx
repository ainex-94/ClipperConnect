// src/app/wallet/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Coins, Wallet as WalletIcon, ArrowRight, CheckCircle, XCircle, PlusCircle } from 'lucide-react';
import { getWalletTransactions, topUpWalletFromCoins, WalletTransaction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function WalletPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isToppingUp, setIsToppingUp] = useState(false);

  const coins = user?.coins || 0;
  const coinValuePKR = (coins / 1000) * 5;

  const fetchTransactions = async () => {
    if (user) {
      setLoading(true);
      const result = await getWalletTransactions(user.uid);
      if (result.success && result.data) {
        setTransactions(result.data);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
      setLoading(false);
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchTransactions();
    }
  }, [user, authLoading]);

  const handleTopUp = async () => {
    const amount = parseInt(topUpAmount, 10);
    if (!user || isNaN(amount) || amount <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid number of coins to convert.' });
      return;
    }

    setIsToppingUp(true);
    const result = await topUpWalletFromCoins({ userId: user.uid, coinsToConvert: amount });
    if (result.success) {
      toast({ title: 'Success', description: result.success });
      await refreshUser(); // Refresh user data to get new balances
      await fetchTransactions(); // Refresh transaction history
      setTopUpAmount('');
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setIsToppingUp(false);
  };

  if (authLoading) {
    return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Wallet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please log in to view your wallet.</p>
        </CardContent>
      </Card>
    );
  }

  const columns: ColumnDef<WalletTransaction>[] = [
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.original.type;
        const Icon = type === 'Top-up' ? PlusCircle : type === 'Payment Sent' ? XCircle : CheckCircle;
        const color = type === 'Top-up' ? 'text-blue-500' : type === 'Payment Sent' ? 'text-red-500' : 'text-green-500';
        return (
          <Badge variant={type === 'Top-up' ? 'secondary' : type === 'Payment Sent' ? 'destructive' : 'default'} className="capitalize flex items-center gap-2">
            <Icon className={`h-4 w-4 ${color}`} />
            {type}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => `PKR ${row.original.amount.toLocaleString()}`,
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      accessorKey: 'timestamp',
      header: 'Date',
      cell: ({ row }) => format(new Date(row.original.timestamp), 'PPP p'),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <WalletIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {(user.walletBalance || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Your available funds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Coins</CardTitle>
            <Coins className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coins.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">≈ PKR {coinValuePKR.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="text-base">Top-up from Coins</CardTitle>
                <CardDescription>Convert your coins to wallet cash.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <Label htmlFor="top-up-amount">Coins to Convert</Label>
                <div className="flex items-center space-x-2">
                    <Input 
                      id="top-up-amount" 
                      type="number" 
                      placeholder={`Max: ${coins}`}
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      disabled={isToppingUp}
                    />
                    <Button onClick={handleTopUp} disabled={isToppingUp || !topUpAmount}>
                      {isToppingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4"/>}
                    </Button>
                </div>
            </CardContent>
        </Card>

      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Wallet History</CardTitle>
          <CardDescription>A record of all your wallet transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={transactions}
              filterColumn="description"
              filterPlaceholder="Filter by description..."
              emptyState="No wallet transactions found."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
