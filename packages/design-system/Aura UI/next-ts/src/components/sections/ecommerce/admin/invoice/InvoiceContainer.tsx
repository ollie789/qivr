import { Paper, Stack } from '@mui/material';
import { Invoice } from 'types/ecommerce';
import InvoiceFooter from 'components/sections/ecommerce/admin/invoice/InvoiceFooter';
import InvoiceHead from 'components/sections/ecommerce/admin/invoice/InvoiceHead';
import InvoiceItemsTable from 'components/sections/ecommerce/admin/invoice/InvoiceItemsTable';
import InvoiceOrderDetails from 'components/sections/ecommerce/admin/invoice/InvoiceOrderDetails';

interface InvoiceContainerProps {
  invoice: Invoice;
}

const InvoiceContainer = ({ invoice }: InvoiceContainerProps) => {
  return (
    <Paper
      background={1}
      sx={{
        height: 1,
        p: { xs: 3, md: 5 },
        borderRadius: 6,
        outline: 'none',
      }}
    >
      <Stack
        direction="column"
        sx={{
          gap: 4,
        }}
      >
        <InvoiceHead />
        <InvoiceOrderDetails invoice={invoice} />
        <InvoiceItemsTable invoice={invoice} />
        <InvoiceFooter />
      </Stack>
    </Paper>
  );
};

export default InvoiceContainer;
