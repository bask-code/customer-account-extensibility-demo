import {
  Button,
  reactExtension,
  useApi
} from "@shopify/ui-extensions-react/customer-account";


export default reactExtension(
  "customer-account.order.action.menu-item.render",
  () => <MenuActionItemExtension />
);
function MenuActionItemExtension() {
  const { i18n } = useApi();
  // return <Button external="true" to="https://kabrita-stage.myshopify.com/tools/recurring/login" onPress={
  //   () => {
  //     console.log('Button clicked');
  //   }
  // }>{i18n.translate("menuAction.button")}</Button>;
  return <Button onP>{i18n.translate("menuAction.button")}</Button>;
}
