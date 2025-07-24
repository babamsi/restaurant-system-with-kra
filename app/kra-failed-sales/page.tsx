'use client'


import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';

export default function KRAFailedSalesPage() {
  const { toast } = useToast();
  const [failedReceipts, setFailedReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [details, setDetails] = useState<any | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  const loadFailedReceipts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sales_invoices')
      .select('*')
      .eq('kra_status', 'error')
      .order('created_at', { ascending: false });
    setFailedReceipts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadFailedReceipts();
  }, []);

  const handleRetry = async (invoiceId: string) => {
    setRetryingId(invoiceId);
    
    try {
      const res = await fetch('/api/kra/retry-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sales_invoice_id: invoiceId }),
      });
      
      const result = await res.json();
      
      if (result.success) {
        // Generate and download PDF receipt on client side
        try {
          const { generateAndDownloadReceipt } = await import('@/lib/receipt-utils')
          await generateAndDownloadReceipt(result.receiptData)
          
          toast({ 
            title: 'KRA Retry Successful', 
            description: `Sale was successfully pushed to KRA. Invoice: ${result.invcNo}. Receipt generated and downloaded.`,
            variant: 'default'
          });
        } catch (receiptError) {
          console.error('Error generating receipt:', receiptError)
          toast({ 
            title: 'KRA Retry Successful', 
            description: `Sale was successfully pushed to KRA. Invoice: ${result.invcNo}. Receipt generation failed.`,
            variant: 'default'
          });
        }
        
        // Reload the failed receipts list
        await loadFailedReceipts();
      } else {
        // Check if it's a duplicate invoice error
        const isDuplicateError = result.error?.toLowerCase().includes('invoice number already exists') ||
                                result.error?.toLowerCase().includes('duplicate invoice') ||
                                result.error?.toLowerCase().includes('invoice already exists');
        
        if (isDuplicateError) {
          toast({ 
            title: 'Duplicate Invoice Error', 
            description: 'Invoice number already exists. The system will automatically use a new invoice number on next retry.',
            variant: 'warning'
          });
        } else {
          toast({ 
            title: 'KRA Retry Failed', 
            description: result.error || 'Failed to retry KRA sale',
            variant: 'destructive' 
          });
        }
        
        // Reload the failed receipts list to show updated error
        await loadFailedReceipts();
      }
    } catch (error) {
      console.error('Retry error:', error);
      toast({ 
        title: 'Retry Error', 
        description: 'An error occurred while retrying the sale',
        variant: 'destructive' 
      });
    } finally {
      setRetryingId(null);
    }
  };

  const handleShowDetails = async (receipt: any) => {
    setSelectedReceipt(receipt);
    setDetailsOpen(true);
    setDetailsLoading(true);
    // Fetch order and items
    const { data: order, error } = await supabase
      .from('table_orders')
      .select('*, items:table_order_items(*)')
      .eq('id', receipt.order_id)
      .single();
    setDetails({ invoice: receipt, order });
    setDetailsLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Failed KRA Sales Receipts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading failed receipts...</span>
            </div>
          ) : failedReceipts.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p>All sales have been successfully pushed to KRA!</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>KRA Error</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failedReceipts.map((receipt) => {
                    const isDuplicateError = receipt.kra_error?.toLowerCase().includes('invoice number already exists') ||
                                            receipt.kra_error?.toLowerCase().includes('duplicate invoice') ||
                                            receipt.kra_error?.toLowerCase().includes('invoice already exists');
                    
                    return (
                      <TableRow key={receipt.id} className="cursor-pointer hover:bg-muted/40" onClick={() => handleShowDetails(receipt)}>
                        <TableCell>{receipt.order_id?.slice(-6)}</TableCell>
                        <TableCell>{new Date(receipt.created_at).toLocaleString()}</TableCell>
                        <TableCell>Ksh {Number(receipt.gross_amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isDuplicateError && (
                              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                Duplicate Invoice
                              </Badge>
                            )}
                            <span className={`text-xs ${isDuplicateError ? 'text-yellow-600' : 'text-red-600'}`}>
                              {receipt.kra_error}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={isDuplicateError ? "secondary" : "destructive"}>
                            {isDuplicateError ? "Duplicate" : "Error"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={retryingId === receipt.id}
                            onClick={e => { e.stopPropagation(); handleRetry(receipt.id); }}
                          >
                            {retryingId === receipt.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Retrying...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                {isDuplicateError ? 'Retry with New Invoice' : 'Retry'}
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg w-full sm:max-w-2xl p-0">
          <DialogHeader>
            <DialogTitle>Failed Sale Details</DialogTitle>
          </DialogHeader>
          {detailsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading details...</span>
            </div>
          ) : details && details.order ? (
            <div className="p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <div>
                  <div className="font-semibold">Order ID:</div>
                  <div className="text-sm text-muted-foreground">{details.invoice.order_id}</div>
                </div>
                <div>
                  <div className="font-semibold">Date:</div>
                  <div className="text-sm text-muted-foreground">{format(new Date(details.invoice.created_at), 'PPpp')}</div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <div>
                  <div className="font-semibold">Customer:</div>
                  <div className="text-sm text-muted-foreground">{details.order.customer_name || 'Walk-in Customer'}</div>
                </div>
                <div>
                  <div className="font-semibold">Table:</div>
                  <div className="text-sm text-muted-foreground">{details.order.table_number}</div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <div>
                  <div className="font-semibold">Total:</div>
                  <div className="text-sm">Ksh {Number(details.invoice.gross_amount).toFixed(2)}</div>
                </div>
                <div>
                  <div className="font-semibold">Tax (VAT):</div>
                  <div className="text-sm">Ksh {Number(details.invoice.tax_amount).toFixed(2)}</div>
                </div>
                <div>
                  <div className="font-semibold">Net:</div>
                  <div className="text-sm">Ksh {Number(details.invoice.net_amount).toFixed(2)}</div>
                </div>
              </div>
              <div>
                <div className="font-semibold mb-2">Items</div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {details.order.items?.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.menu_item_name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>Ksh {Number(item.unit_price).toFixed(2)}</TableCell>
                          <TableCell>Ksh {Number(item.total_price).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div>
                <div className="font-semibold mb-1">KRA Error</div>
                <div className="text-sm text-red-600 break-words whitespace-pre-wrap">{details.invoice.kra_error}</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">No details found.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 