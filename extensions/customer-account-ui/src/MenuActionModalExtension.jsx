import {
  Button,
  CustomerAccountAction,
  BlockStack,
  reactExtension,
  TextBlock,
  Banner,
  useApi
} from "@shopify/ui-extensions-react/customer-account";



export default reactExtension(
  "customer-account.order.action.render",
  () => <PromotionBanner />
);

function PromotionBanner() {
  const api = useApi();
  const { i18n } = useApi();

  return (
    <CustomerAccountAction
      title={i18n.translate("menuAction.title")}
      primaryAction={
        <Button
          onPress={() => {
            api.close();
          }}
        >
          {i18n.translate("menuAction.primaryAction")}
        </Button>
      }
    >
      <TextBlock>{i18n.translate("menuAction.content")}</TextBlock>
    </CustomerAccountAction>
  );
}


