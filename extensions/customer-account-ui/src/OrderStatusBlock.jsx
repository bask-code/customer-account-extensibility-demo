import {
  Button,
  reactExtension,
  useApi,
  useOrder,
  useCartLines,
  useAuthenticationState,
  useExtension
} from "@shopify/ui-extensions-react/customer-account";


export default reactExtension(
  "customer-account.order-status.block.render",
  () => <OrderStatusBlock />
);
function OrderStatusBlock() {
  const api = useApi();
  const order = useOrder();
  const cartLines = useCartLines();
  const authenticated = useAuthenticationState();
  const { capabilities } = useExtension();

  // https://shopify.dev/docs/apps/build/customer-accounts/order-action-extensions/build-for-order-action-menus?extension=react

  // console.log('api', api);
  // console.log('order', order);
  // console.log('cartLines', cartLines);
  // console.log('authenticated', authenticated);
  // console.log('capabilities', capabilities);
  return <Button>test</Button>;
}
