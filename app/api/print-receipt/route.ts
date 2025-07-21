import { NextRequest, NextResponse } from 'next/server';
import { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } from 'node-thermal-printer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // body should include: { items, order, totals, restaurant, table, date, time, receiptId }
    const { order, items, totals, restaurant, table, date, time, receiptId } = body;

    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: 'tcp://192.168.1.112', // <-- Set your printer IP here
      options: { timeout: 1000 },
      width: 48,
      characterSet: CharacterSet.SLOVENIA,
      breakLine: BreakLine.WORD,
      removeSpecialCharacters: false,
      lineCharacter: '-',
    });

    // Header
    printer.alignCenter();
    printer.println(restaurant || 'RESTAURANT NAME');
    printer.println('123 Main Street, City');
    printer.println('Phone: (123) 456-7890');
    printer.drawLine();

    printer.alignLeft();
    printer.println(`Order #: ${receiptId || order?.id?.slice(-6)}`);
    printer.println(`Table: ${table || order?.table_number}`);
    printer.println(`Date: ${date || new Date().toLocaleDateString()}`);
    printer.println(`Time: ${time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    printer.drawLine();

    // Items
    items.forEach((item: any) => {
      printer.println(`${item.menu_item_name || item.name}${item.portion_size ? ` (${item.portion_size})` : ''}`);
      if (item.customization_notes) {
        printer.println(`  *${item.customization_notes}`);
      }
      printer.leftRight(
        `x${item.quantity} @ ${item.unit_price.toFixed(2)}`,
        (item.total_price || (item.unit_price * item.quantity)).toFixed(2)
      );
    });
    printer.drawLine();

    // Totals
    printer.println(`Subtotal: Ksh ${totals?.subtotal?.toFixed(2)}`);
    printer.println(`Tax (16%): Ksh ${totals?.tax?.toFixed(2)}`);
    printer.println(`Total: Ksh ${totals?.total?.toFixed(2)}`);
    printer.drawLine();

    printer.alignCenter();
    printer.println('Thank you for dining with us!');
    printer.cut();
    printer.openCashDrawer();

    // Print
    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      return NextResponse.json({ success: false, error: 'Printer not connected' }, { status: 500 });
    }
    await printer.execute();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Print error' }, { status: 500 });
  }
} 