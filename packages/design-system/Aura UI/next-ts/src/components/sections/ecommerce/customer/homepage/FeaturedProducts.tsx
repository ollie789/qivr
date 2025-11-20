import { Box, Button, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import paths from 'routes/paths';
import { ProductDetails } from 'types/ecommerce';
import ProductCard from '../common/ProductCard';

interface FeaturedProductsProps {
  products: ProductDetails[];
}

const FeaturedProducts = ({ products }: FeaturedProductsProps) => {
  return (
    <Box sx={{ px: { xs: 3, md: 5 }, py: 5 }}>
      <Typography
        variant="h4"
        sx={{
          textAlign: 'center',
          mb: 4,
        }}
      >
        Featured products just for you
      </Typography>
      <Grid
        container
        columns={{ xs: 1, sm: 2, md: 3, xl: 5 }}
        sx={{
          mb: 4,
        }}
      >
        {products.map((product) => (
          <Grid key={product.id} size={1}>
            <ProductCard product={product} sx={{ borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>
      <Button
        variant="contained"
        color="neutral"
        href={paths.products}
        sx={{
          display: 'block',
          mx: 'auto',
          width: 'fit-content',
        }}
      >
        Load more products
      </Button>
    </Box>
  );
};

export default FeaturedProducts;
