import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useActionData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

//  https://shopify.dev/docs/api/admin-graphql/unstable/mutations/metafieldDefinitionUpdate
const getMetafieldQuery = `#graphql
  query getMetafieldDefinition($key: String!, $namespace: String!, $ownerType: MetafieldOwnerType!) {
    metafieldDefinitions(first: 1, key: $key, namespace: $namespace, ownerType: $ownerType) {
      nodes {
        id
        key
        name
        namespace
        ownerType
        type {
          category
          name
        }
        access {
          admin
          customerAccount
          storefront
        }
      }
    }
  }
`;

async function getMetafield(admin: AdminApiContext<ShopifyRestResources>, key, type: MetafieldOwnerType) {
  const response = await admin.graphql(getMetafieldQuery, {
    variables: {
      key: key,
      namespace: "$app:preferences",
      ownerType: type
    },
  });

  const json = await response.json();
  return json.data.metafieldDefinitions.nodes[0];
}

const createMetafieldMutation = `#graphql
  mutation metafieldDefinitionCreate($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition {
        id
        key
        name
        namespace
        ownerType
        type {
          category
          name
        }
        access {
          admin
          customerAccount
          storefront
        }
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

async function createMetafield(admin: AdminApiContext<ShopifyRestResources>, key, type: MetafieldOwnerType) {
  const response = await admin.graphql(createMetafieldMutation, {
    variables: {
      definition: {
        access: {
          customerAccount: "READ_WRITE",
          admin: "PUBLIC_READ",
          storefront: "PUBLIC_READ",
        },
        pin: true,
        key: key,
        name: key,
        namespace: "$app:preferences",
        ownerType: type,
        type: "single_line_text_field",
      },
    },
  });

  const json = await response.json();
  return json.data.metafieldDefinitionCreate;
}

const updateMetafieldMutation = `#graphql
  mutation UpdateMetafieldDefinition($definition: MetafieldDefinitionUpdateInput!) {
    metafieldDefinitionUpdate(definition: $definition) {
      updatedDefinition {
        id
        key
        name
        namespace
        ownerType
        type {
          category
          name
        }
        access {
          admin
          customerAccount
          storefront
        }
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

async function updateMetafield(admin: AdminApiContext<ShopifyRestResources>, key, type: MetafieldOwnerType) {
  const response = await admin.graphql(updateMetafieldMutation, {
    variables: {
      definition: {
        access: {
          customerAccount: "READ_WRITE",
          admin: "PUBLIC_READ",
          storefront: "PUBLIC_READ",
        },
        pin: true,
        key: key,
        name: key,
        namespace: "$app:preferences",
        ownerType: type,
      },
    },
  });

  const json = await response.json();
  return json.data.metafieldDefinitionUpdate;
}


// Set data for the order metafield
// https://shopify.dev/docs/api/usage/access-scopes#customer-access-scopes (no access to order metafields)

const setOrderDetailsMutation = `#graphql
  mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        key
        namespace
        value
        createdAt
        updatedAt
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

async function setOrderDetails(admin: AdminApiContext<ShopifyRestResources>, id, deliveryTime) {
  const response = await admin.graphql(setOrderDetailsMutation, {
    variables: {
      metafields: [
        {
          key: "expected_delivery_time",
          namespace: "$app:preferences",
          ownerId: `gid://shopify/Order/${id}`,
          type: "single_line_text_field",
          value: deliveryTime || "",
        },
      ],
    },
  });

  const json = await response.json();
  return json.data.metafieldsSet;
}


export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  // Get the input from the request
  const body = await request.formData();
  const key = body.get("key");
  const type = body.get("type")<MetafieldOwnerType>;

  // Get the field
  const get = await getMetafield(admin, key, type);

  // Create if it doesn't exist
  const response = (!get || !get.id) ? await createMetafield(admin, key, type) : await updateMetafield(admin, key, type);

  // Set the order details
  const set = (type === "ORDER") ? await setOrderDetails(admin, "6128892608816", "2 days") : null;

  // Return the response
  return json({
    key: key,
    type: type,
    get: get,
    set: set,
    response: response,
  });
};

export default function Index() {
  const fetcher = useFetcher<typeof action>();
  const data = useActionData<typeof action>();

  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";

  // Log fetcher data
  console.log('data', fetcher.data);

  // Submit
  // const generateMetafield = () => fetcher.submit({key: "nickname", type: "CUSTOMER"}, { method: "POST" });
  const generateMetafield = () => fetcher.submit({key: "expected_delivery_time", type: "ORDER"}, { method: "POST" });

  return (
    <Page>
      <TitleBar title="Remix app template">
        <button variant="primary" onClick={generateMetafield}>
          Generate a metafield
        </button>
      </TitleBar>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Congrats on creating a new Shopify app 🎉
                  </Text>
                  <Text variant="bodyMd" as="p">
                    This embedded app template uses{" "}
                    <Link
                      url="https://shopify.dev/docs/apps/tools/app-bridge"
                      target="_blank"
                      removeUnderline
                    >
                      App Bridge
                    </Link>{" "}
                    interface examples like an{" "}
                    <Link url="/app/additional" removeUnderline>
                      additional page in the app nav
                    </Link>
                    , as well as an{" "}
                    <Link
                      url="https://shopify.dev/docs/api/admin-graphql"
                      target="_blank"
                      removeUnderline
                    >
                      Admin GraphQL
                    </Link>{" "}
                    mutation demo, to provide a starting point for app
                    development.
                  </Text>
                </BlockStack>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    Get started with products
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Generate a product with GraphQL and get the JSON output for
                    that product. Learn more about the{" "}
                    <Link
                      url="https://shopify.dev/docs/api/admin-graphql/latest/mutations/productCreate"
                      target="_blank"
                      removeUnderline
                    >
                      productCreate
                    </Link>{" "}
                    mutation in our API references.
                  </Text>
                </BlockStack>
                <InlineStack gap="300">
                  <Button loading={isLoading} onClick={generateMetafield}>
                    Generate a metafield
                  </Button>
                </InlineStack>
                {fetcher.data && (
                  <>
                    <Text as="h3" variant="headingMd">
                      {" "}
                      Metafield mutation
                    </Text>
                    <Box
                      padding="400"
                      background="bg-surface-active"
                      borderWidth="025"
                      borderRadius="200"
                      borderColor="border"
                      overflowX="scroll"
                    >
                      <pre style={{ margin: 0 }}>
                        <code>
                          {JSON.stringify(fetcher.data, null, 2)}
                        </code>
                      </pre>
                    </Box>
                    <Text as="h3" variant="headingMd">
                      {" "}
                      productVariantsBulkUpdate mutation
                    </Text>
                  </>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    App template specs
                  </Text>
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Framework
                      </Text>
                      <Link
                        url="https://remix.run"
                        target="_blank"
                        removeUnderline
                      >
                        Remix
                      </Link>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Database
                      </Text>
                      <Link
                        url="https://www.prisma.io/"
                        target="_blank"
                        removeUnderline
                      >
                        Prisma
                      </Link>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Interface
                      </Text>
                      <span>
                        <Link
                          url="https://polaris.shopify.com"
                          target="_blank"
                          removeUnderline
                        >
                          Polaris
                        </Link>
                        {", "}
                        <Link
                          url="https://shopify.dev/docs/apps/tools/app-bridge"
                          target="_blank"
                          removeUnderline
                        >
                          App Bridge
                        </Link>
                      </span>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        API
                      </Text>
                      <Link
                        url="https://shopify.dev/docs/api/admin-graphql"
                        target="_blank"
                        removeUnderline
                      >
                        GraphQL API
                      </Link>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Next steps
                  </Text>
                  <List>
                    <List.Item>
                      Build an{" "}
                      <Link
                        url="https://shopify.dev/docs/apps/getting-started/build-app-example"
                        target="_blank"
                        removeUnderline
                      >
                        {" "}
                        example app
                      </Link>{" "}
                      to get started
                    </List.Item>
                    <List.Item>
                      Explore Shopify’s API with{" "}
                      <Link
                        url="https://shopify.dev/docs/apps/tools/graphiql-admin-api"
                        target="_blank"
                        removeUnderline
                      >
                        GraphiQL
                      </Link>
                    </List.Item>
                  </List>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
