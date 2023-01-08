import {
  Banner,
  Button,
  Card,
  DataTable,
  DescriptionList,
  Layout,
  Link,
  List,
  Modal,
  Page,
  Pagination,
  TextContainer,
} from '@shopify/polaris';
import { useCallback, useEffect, useState } from 'react';
import kasheeAxios from '../wrappers/kasheeAxios';

const Index = () => {
  useEffect(() => {
    Promise.all([loadStoreDetails(), loadConversions()]);
  }, []);

  const [discountCodes, setDiscountCodes] = useState([]);
  const [conversions, setConversions] = useState({});
  const [active, setActive] = useState(false);
  const [eventDetails, setEventDetails] = useState({});

  const [
    paginationDiscountCodeSettings,
    setPaginationDiscountCodeSettings,
  ] = useState({});
  const [
    paginationConvertionsSettings,
    setPaginationConvertionsSettings,
  ] = useState({});

  const [loadingDiscountCodes, setLoadingDiscountCodes] = useState(false);
  const [loadingConvertion, setLoadingConvertion] = useState(false);

  const handleChange = useCallback(() => setActive(false), [active]);

  const loadStoreDetails = async (page = 1, limit = 10) => {
    setLoadingDiscountCodes(true);

    const result = await kasheeAxios.get(`store?page=${page}&limit=${limit}`);
    const { data } = result;

    const pagination = {
      page: data.page,
      items_per_page: data.items_per_page,
      pre_page: data.pre_page,
      next_page: data.next_page,
      total: data.total,
      total_pages: data.total_pages,
    };
    let rows = [];

    data.discountCodes?.forEach((element) => {
      rows.push([element.internalDiscountCode]);
    });

    //TODO: implement pagination
    rows = rows.slice(0, 10);

    setDiscountCodes(rows);

    setLoadingDiscountCodes(false);
    setPaginationDiscountCodeSettings(pagination);
  };

  const loadConversions = async (page = 1, limit = 10) => {
    setLoadingConvertion(true);

    const result = await kasheeAxios.get(
      `store/conversion?page=${page}&limit=${limit}`
    );
    const { data } = result;

    const pagination = {
      page: data.page,
      items_per_page: data.limit,
      pre_page: data.prevPage,
      next_page: data.nextPage,
      total: data.totalDocs,
      total_pages: data.totalPages,
    };

    const rows = [];
    data.docs?.forEach((e) => {
      rows.push([
        <Button plain onClick={() => onConversionClick(e.discountCode)}>
          {e.discountCode}
        </Button>,
        new Date(e.conversionDate).toLocaleString('en-US'),
        e.affiliateS3,
        e.billingStatus,
      ]);
    });
    setConversions(rows);
    setPaginationConvertionsSettings(pagination);
    setLoadingConvertion(false);
  };

  const onConversionClick = async (discountCode) => {
    const result = await kasheeAxios.get(`store/conversion/${discountCode}`);
    const { data } = result;
    setEventDetails(data);
    setActive(true);
    console.log(data);
  };

  return (
    <Page title="Welcome to Kashee Rewards" fullWidth>
      <Layout>
        <Layout.Section sectioned>
          <p>Find some important information in this section.</p>
        </Layout.Section>
      </Layout>
      <Layout.AnnotatedSection
        id="kasheeBadge"
        title="1. Enable Kashee Badge in your store"
        description="Once visitors see the Kashee Badge in your pages, they can easily know that you are a participant store, increasing your conversions."
      >
        <Card title="Instructions to activate the Kashee Badge in your template">
          <Card.Section>
            <Banner
              title="Only supported for Online Stores 2.0 themes"
              secondaryAction={{
                content: 'Learn more',
                url:
                  'https://help.shopify.com/en/manual/online-store/themes/os20/',
              }}
              status="info"
            >
              <p>Make sure your theme is 2.0 or higher.</p>
            </Banner>
          </Card.Section>
          <Card.Section>
            <TextContainer>
              We recommend you to activate the Kashee Badge in your pages to
              show to your potential customers that you are a participant store
              of the Kashee Rewards program, this way they can easily identify
              you. You decide where you can show the Kashee Badge, just follow
              the instructions below:
            </TextContainer>
          </Card.Section>
          <Card.Section title="Step by Step">
            <List>
              <List.Item>
                1. From your Shopify admin, go to Online Store {'>'} Themes.
              </List.Item>
              <List.Item>
                2. Find the theme that you want to edit, and then click
                Customize.
              </List.Item>
              <List.Item>
                3. Navigate to the page and section where you want to add the
                app block.
              </List.Item>
              <List.Item>4. Click Add block.</List.Item>
              <List.Item>
                5. From the drop-down menu, in the Apps section, type Kashee
                Badge or scroll down until you see the Kashee Badge item under
                the Apps sections.
              </List.Item>
              <List.Item>
                6. Optional: move the Kashee Badge to the place you want it in
                the section, and customize the Kashee Badge using any available
                settings, like Background Color, Width and Height.
              </List.Item>
              <List.Item>7. Click Save.</List.Item>
            </List>
          </Card.Section>
        </Card>
      </Layout.AnnotatedSection>
      <Layout.AnnotatedSection
        id="listing"
        title="2. Filling in your Store Listing"
        description="Can you a see a tab above called Listing? Click on there and fill in as much information as you can regarding your store. It will not take more than 5 minutes."
      >
        <Card title="I want to promote my store in the Kashee Rewards program">
          <Card.Section>
            <TextContainer>
              You should take a few minutes to setup your store listing, this
              way Kashee will start promoting your store for its customers
              database. Your store will also be visible in the Kashee Rewards
              website. See more: https://rewards.kashee.com
            </TextContainer>
          </Card.Section>
        </Card>
      </Layout.AnnotatedSection>
      <Layout.AnnotatedSection
        id="settings"
        title="3. Extra Settings"
        description="You can also setup certain features, like the Maximum Cap for Discount Codes generated by Kashee"
      >
        <Card title="Changing my Store Settings in Kashee">
          <Card.Section>
            <TextContainer>
              Do not forget to visit the tab above called Settings to make sure
              your store settings is set as you expect.
            </TextContainer>
          </Card.Section>
        </Card>
      </Layout.AnnotatedSection>
      <Layout.AnnotatedSection
        id="discountCodes"
        title="4. Discount Codes generated by Kashee"
        description="Find a list of all available Discount Codes generated by Kashee."
      >
        <Card>
          <Card.Section>
            <DataTable
              columnContentTypes={['text']}
              headings={['Discount Code']}
              rows={discountCodes}
            />
            <Pagination
              label={`${
                !loadingDiscountCodes
                  ? 'page ' +
                    paginationDiscountCodeSettings.page +
                    ' of ' +
                    paginationDiscountCodeSettings.total_pages
                  : 'loading'
              }`}
              hasPrevious={paginationDiscountCodeSettings.page > 1}
              onPrevious={() =>
                loadStoreDetails(+paginationDiscountCodeSettings.page - 1)
              }
              hasNext={
                paginationDiscountCodeSettings.page <
                paginationDiscountCodeSettings.total_pages
              }
              onNext={() =>
                loadStoreDetails(+paginationDiscountCodeSettings.page + 1)
              }
            />
          </Card.Section>
        </Card>
      </Layout.AnnotatedSection>
      <Layout.AnnotatedSection
        id="conversions"
        title="5. All Kashee Conversions for your store"
        description="Find a list of all conversions created by Kashee. Click on the Discount Code to check the Order Proof."
      >
        <Card>
          <Card.Section>
            {conversions?.length > 0 ? (
              <>
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text']}
                  headings={[
                    'Discount Code',
                    'Conversion Date',
                    'S3 Param',
                    'Billing Status',
                  ]}
                  rows={conversions}
                />
                <Pagination
                  label={`${
                    !loadingConvertion
                      ? 'page ' +
                        paginationConvertionsSettings.page +
                        ' of ' +
                        paginationConvertionsSettings.total_pages
                      : 'loading'
                  }`}
                  hasPrevious={paginationConvertionsSettings.page > 1}
                  onPrevious={() =>
                    loadConversions(+paginationConvertionsSettings.page - 1)
                  }
                  hasNext={
                    paginationConvertionsSettings.page <
                    paginationConvertionsSettings.total_pages
                  }
                  onNext={() =>
                    loadConversions(+paginationConvertionsSettings.page + 1)
                  }
                />
              </>
            ) : null}
          </Card.Section>
        </Card>
      </Layout.AnnotatedSection>
      <Modal
        open={active}
        onClose={handleChange}
        title="Find more details about the conversion below"
        primaryAction={{
          content: 'Close',
          onAction: handleChange,
        }}
      >
        <Modal.Section>
          {eventDetails?.customer ? (
            <Card>
              <Card.Section title="Customer Details">
                <p>{eventDetails.customer.name}</p>
                <p>{eventDetails.customer.email}</p>
                <p>{eventDetails.customer.address1}</p>
                <p>{eventDetails.customer.address2}</p>
                <p>
                  {eventDetails.customer.city} - {eventDetails.customer.city} -{' '}
                  {eventDetails.customer.country}
                </p>
                <p>{eventDetails.customer.zip}</p>
              </Card.Section>
              <Card.Section title="Order Details">
                <p>
                  {eventDetails.order.number} -{' '}
                  {new Date(eventDetails.order.createDate).toLocaleString(
                    'en-US'
                  )}
                </p>
                <p>
                  <Link url={eventDetails.order.proofUrl} external>
                    Order Proof
                  </Link>
                </p>
              </Card.Section>
              <Card.Section title="Billing Details">
                {eventDetails.billingDetails.paymentDetails
                  ?.creditCardNumber ? (
                  <DescriptionList
                    items={[
                      {
                        term: 'Status',
                        description:
                          eventDetails.billingDetails.financialStatus,
                      },
                      {
                        term: 'Card',
                        description:
                          eventDetails.billingDetails.paymentDetails
                            ?.creditCardNumber,
                      },
                      {
                        term: 'Gateway',
                        description:
                          eventDetails.billingDetails.paymentDetails
                            ?.creditCardCompany,
                      },
                      {
                        term: 'Processed at',
                        description: new Date(
                          eventDetails.billingDetails.processedAt
                        ).toLocaleString('en-US'),
                      },
                      {
                        term: 'Taxes',
                        description:
                          eventDetails.billingDetails.currency +
                          ' ' +
                          eventDetails.billingDetails.totalTax,
                      },
                      {
                        term: 'Discounts',
                        description:
                          eventDetails.billingDetails.currency +
                          ' ' +
                          eventDetails.billingDetails.totalDiscounts,
                      },
                      {
                        term: 'Total Price',
                        description:
                          eventDetails.billingDetails.currency +
                          ' ' +
                          eventDetails.billingDetails.totalPrice,
                      },
                    ]}
                  />
                ) : (
                  <DescriptionList
                    items={[
                      {
                        term: 'Status',
                        description:
                          eventDetails.billingDetails.financialStatus,
                      },
                      {
                        term: 'Processed at',
                        description: new Date(
                          eventDetails.billingDetails.processedAt
                        ).toLocaleString('en-US'),
                      },
                      {
                        term: 'Taxes',
                        description:
                          eventDetails.billingDetails.currency +
                          ' ' +
                          eventDetails.billingDetails.totalTax,
                      },
                      {
                        term: 'Discounts',
                        description:
                          eventDetails.billingDetails.currency +
                          ' ' +
                          eventDetails.billingDetails.totalDiscounts,
                      },
                      {
                        term: 'Total Price',
                        description:
                          eventDetails.billingDetails.currency +
                          ' ' +
                          eventDetails.billingDetails.totalPrice,
                      },
                    ]}
                  />
                )}
              </Card.Section>
            </Card>
          ) : null}
        </Modal.Section>
      </Modal>
    </Page>
  );
};

export default Index;
