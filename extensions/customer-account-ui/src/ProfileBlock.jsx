import {
  BlockStack,
  reactExtension,
  TextBlock,
  Banner,
  useApi,
  useAuthenticatedAccountCustomer
} from "@shopify/ui-extensions-react/customer-account";

import { useEffect, useState } from "react";

export default reactExtension(
  "customer-account.profile.block.render",
  () => <PromotionBanner />
);

function PromotionBanner() {
  const { i18n } = useApi();
  const customer = useAuthenticatedAccountCustomer();
  console.log('customer', customer);

  // Update a metafield
  // https://shopify.dev/docs/apps/build/customer-accounts/metafields?extension=react

  const getCustomerNameQuery = {
    query: `query {
      customer {
        firstName
        id
        metafield(namespace: "$app:preferences", key: "nickname") {
          value
        }
        orders(first: 10) {
          edges {
            node {
              id
              name
            }
          }
        }
      }
      order(id: "gid://shopify/Order/6128892608816") {
        id
        name
      }
    }`
  };

  useEffect(() => {
    fetch("shopify://customer-account/api/unstable/graphql.json",
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(getCustomerNameQuery),
      }).then((response) => response.json())
      .then((response) => {
        console.log('get customer data', response)
        setCustomerPreferences(customer.id, '(B)(A)(A)(S)');
        setOrderDetails(response.data.order, '2 days');
      })
      .catch(console.error);
  });

  return (
    <Banner>
      <BlockStack inlineAlignment="center" >
        <TextBlock>
          {i18n.translate("earnPoints")}
        </TextBlock>
      </BlockStack>
    </Banner>
  );
}

// https://shopify.dev/docs/api/customer/unstable/mutations/metafieldsSet
// https://shopify.dev/docs/apps/build/customer-accounts/metafields?extension=react
async function setCustomerPreferences(customerId, nickName) {
  const response = await fetch("shopify:customer-account/api/2024-07/graphql.json", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `mutation setPreferences($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              id
              key
              namespace
              type
              value
            }
            userErrors {
              field
              message
              code
              elementIndex
            }
          }
        }`,
      variables: {
        metafields: [
          {
            key: "nickname",
            namespace: "$app:preferences",
            ownerId: `gid://shopify/Customer/${customerId}`,
            type: "single_line_text_field",
            value: nickName ?? "",
          },
        ],
      },
    }),
  });
  const data = await response.json();
  console.log('set customer metafield', data);
}


// https://shopify.dev/docs/api/usage/access-scopes#customer-access-scopes (no access to order metafields)
// We can't set order details from the customer account extension because we don't have access to the order metafields scope
// We can only access the order metafields from the admin api. Can we communicate to the app folder?
// It Seems session-tokens are needed for this: https://shopify.dev/docs/api/customer-account-ui-extensions/unstable/apis/session-token
async function setOrderDetails(order, deliveryTime) {
  const response = await fetch("shopify:customer-account/api/2024-07/graphql.json", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `mutation setOrderDetails($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              id
              key
              namespace
              type
              value
            }
            userErrors {
              field
              message
              code
              elementIndex
            }
          }
        }`,
      variables: {
        metafields: [
          {
            key: "expected_delivery_time",
            namespace: "$app:preferences",
            ownerId: order.id,
            type: "single_line_text_field",
            value: deliveryTime ?? "",
          },
        ],
      },
    }),
  });
  const data = await response.json();
  console.log('set order metafield', data);
}
