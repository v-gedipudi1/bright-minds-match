import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Smartphone, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import venmoQr from "@/assets/venmo-qr.png";

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStripePayment: () => void;
  onManualPaymentConfirm: () => void;
  processingStripe: boolean;
  processingManual: boolean;
  sessionPrice: number;
  sessionSubject: string;
}

type PaymentView = "select" | "zelle" | "venmo";

const PaymentMethodDialog = ({
  open,
  onOpenChange,
  onStripePayment,
  onManualPaymentConfirm,
  processingStripe,
  processingManual,
  sessionPrice,
  sessionSubject,
}: PaymentMethodDialogProps) => {
  const [view, setView] = useState<PaymentView>("select");

  const handleClose = () => {
    setView("select");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {view === "select" && "Choose Payment Method"}
            {view === "zelle" && "Pay with Zelle"}
            {view === "venmo" && "Pay with Venmo"}
          </DialogTitle>
          <DialogDescription>
            {view === "select" && `Pay $${sessionPrice?.toFixed(2)} for ${sessionSubject}`}
            {view !== "select" && (
              <button
                onClick={() => setView("select")}
                className="flex items-center gap-1 text-primary hover:underline mt-1"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to payment options
              </button>
            )}
          </DialogDescription>
        </DialogHeader>

        {view === "select" && (
          <div className="grid gap-3 py-4">
            <Button
              variant="outline"
              className="h-16 justify-start gap-4 text-left"
              onClick={() => setView("zelle")}
            >
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Zelle</p>
                <p className="text-sm text-muted-foreground">Pay via bank transfer</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-16 justify-start gap-4 text-left"
              onClick={() => setView("venmo")}
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">V</span>
              </div>
              <div>
                <p className="font-medium">Venmo</p>
                <p className="text-sm text-muted-foreground">Pay with Venmo app</p>
              </div>
            </Button>

            {/* Stripe payment option - temporarily hidden, uncomment to re-enable */}
            {/* <Button
              variant="outline"
              className="h-16 justify-start gap-4 text-left"
              onClick={onStripePayment}
              disabled={processingStripe}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                {processingStripe ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : (
                  <CreditCard className="w-5 h-5 text-primary" />
                )}
              </div>
              <div>
                <p className="font-medium">Credit/Debit Card</p>
                <p className="text-sm text-muted-foreground">Pay securely with Stripe</p>
              </div>
            </Button> */}
          </div>
        )}

        {view === "zelle" && (
          <div className="py-4 space-y-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-sm text-muted-foreground mb-2">
                Send <span className="font-bold text-foreground">${sessionPrice?.toFixed(2)}</span> via Zelle to:
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                848-234-8043
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Include your name and "{sessionSubject}" in the memo.
            </p>
            <Button
              onClick={onManualPaymentConfirm}
              disabled={processingManual}
              className="w-full"
            >
              {processingManual ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              I've Sent Payment
            </Button>
          </div>
        )}

        {view === "venmo" && (
          <div className="py-4 space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-muted-foreground mb-2">
                Send <span className="font-bold text-foreground">${sessionPrice?.toFixed(2)}</span> via Venmo to:
              </p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                @brightmindsts
              </p>
              <div className="flex justify-center">
                <img
                  src={venmoQr}
                  alt="Venmo QR Code"
                  className="w-48 h-48 rounded-lg bg-white p-2"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Scan the QR code or search for @brightmindsts in Venmo. Include your name and "{sessionSubject}" in the note.
            </p>
            <Button
              onClick={onManualPaymentConfirm}
              disabled={processingManual}
              className="w-full"
            >
              {processingManual ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              I've Sent Payment
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMethodDialog;
