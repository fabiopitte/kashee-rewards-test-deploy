import { ResourcePicker } from '@shopify/app-bridge-react';
import {
  Button,
  Caption,
  Card,
  DropZone,
  FormLayout,
  Layout,
  MediaCard,
  Page,
  SettingToggle,
  Stack,
  TextField,
  TextStyle,
  Thumbnail,
  Toast,
  Frame,
} from '@shopify/polaris';
import { useCallback, useEffect, useState } from 'react';
import kasheeAxios from '../wrappers/kasheeAxios';

const Listing = () => {
  useEffect(() => {
    getListing();
  }, []);

  const getListing = async () => {
    const result = await kasheeAxios.get('listing');
    const { data } = result;

    if (data) {
      setStoreName(data.storeName);
      setActive(data.isActive);
      setTagline(data.tagline);
      setDescription(data.description);
      setStoreIconUrl(data.storeIconUrl);
      setBannerUrl(data.bannerUrl);
      setFeaturedProduct1(data.featuredProduct1Url);
      setFeaturedProduct2(data.featuredProduct2Url);
    }
  };

  const save = async () => {
    // add formatted prices for products
    featuredProduct1.priceFormatted = `$${featuredProduct1.price}`;
    featuredProduct1.fullPriceFormatted = `$${featuredProduct1.fullPrice}`;
    featuredProduct1.saveOffPriceFormatted = `$${featuredProduct1.saveOfPrice}`;

    featuredProduct2.priceFormatted = `$${featuredProduct2.price}`;
    featuredProduct2.fullPriceFormatted = `$${featuredProduct2.fullPrice}`;
    featuredProduct2.saveOffPriceFormatted = `$${featuredProduct2.saveOfPrice}`;

    const payload = {
      isActive: active,
      storeName,
      tagline,
      description,
      storeIconUrl,
      bannerUrl,
      featuredProduct1Url: featuredProduct1,
      featuredProduct2Url: featuredProduct2,
    };

    const result = await kasheeAxios.post('listing', payload);
    if (result) {
      setToastActive(true);
    }
  };

  const [storeName, setStoreName] = useState(null);
  const [tagline, setTagline] = useState(null);
  const [description, setDescription] = useState(null);
  const [storeIconUrl, setStoreIconUrl] = useState(null);
  const [bannerUrl, setBannerUrl] = useState(null);
  const [toastActive, setToastActive] = useState(false);

  const [files, setFiles] = useState([]);
  const [active, setActive] = useState(false);
  const [open, setOpen] = useState(false);
  const [featuredProduct1, setFeaturedProduct1] = useState(null);
  const [featuredProduct2, setFeaturedProduct2] = useState(null);
  const [currentFeaturedProductName, setCurrentFeaturedProductName] = useState(
    null
  );

  const handleToggle = useCallback(() => setActive((active) => !active), []);

  const contentStatus = active ? 'Deactivate' : 'Activate';
  const textStatus = active ? 'activated' : 'deactivated';

  const handleDropZoneDrop = useCallback(
    (_dropFiles, acceptedFiles, _rejectedFiles) =>
      setFiles((files) => [...files, ...acceptedFiles]),
    []
  );

  const handleSelection = (resources) => {
    setOpen(false);
    if (currentFeaturedProductName === 'featuredProduct1')
      setFeaturedProduct1(formatResource(resources));
    if (currentFeaturedProductName === 'featuredProduct2')
      setFeaturedProduct2(formatResource(resources));
  };

  const formatResource = (resource) => {
    const { selection } = resource;
    const product = selection[0];
    const compareAtPrice =
      +product.variants[0]?.compareAtPrice || +product.variants[0].price;

    return {
      url: product.handle,
      productId: product.id,
      title: product.title,
      imageUrl: product.images[0].originalSrc,
      description: product.descriptionHtml,
      tags: product.tags,
      productVariantId: product.variants[0].id,
      price: +product.variants[0].price,
      fullPrice: +compareAtPrice,
      saveOffPrice: (compareAtPrice - +product.variants[0].price).toFixed(2),
      discountPercentage: (
        100 -
        (+product.variants[0].price / compareAtPrice) * 100
      ).toFixed(2),
    };
  };

  const validImageTypes = ['image/gif', 'image/jpeg', 'image/png'];

  const fileUpload = !files.length && <DropZone.FileUpload />;
  const uploadedFiles = files.length > 0 && (
    <Stack vertical>
      {files.map((file, index) => (
        <Stack alignment="center" key={index}>
          <Thumbnail
            size="small"
            alt={file.name}
            source={
              validImageTypes.includes(file.type)
                ? window.URL.createObjectURL(file)
                : NoteMinor
            }
          />
          <div>
            {file.name} <Caption>{file.size} bytes</Caption>
          </div>
        </Stack>
      ))}
    </Stack>
  );

  return (
    <Frame>
      <Page
        title="Listing Information"
        fullWidth
        primaryAction={{
          content: 'Save',
          onAction: () => save(),
        }}
      >
        <Layout.AnnotatedSection
          id="isActivated"
          title="1. Activate your Listing"
          description="Your store will be advertised for millions of Kashee Rewards customers!"
        >
          <SettingToggle
            action={{
              content: contentStatus,
              onAction: handleToggle,
            }}
            enabled={active}
          >
            Your store is <TextStyle variation="strong">{textStatus}</TextStyle>
            .
          </SettingToggle>
        </Layout.AnnotatedSection>
        <Layout.AnnotatedSection
          id="storeDetails"
          title="2. Store details"
          description="We are going to show the information that you filled in on this section when listing your store to the Kashee Rewards page. See more at https://rewards.kashee.com"
        >
          <Card sectioned>
            <FormLayout>
              <TextField
                label="Store name"
                onChange={(v) => setStoreName(v)}
                autoComplete="off"
                placeholder="Confirm the name of your store, and feel free to change it as you wish"
                showCharacterCount
                maxLength={30}
                value={storeName}
              />
              <TextField
                label="Tagline"
                onChange={(v) => setTagline(v)}
                autoComplete="off"
                placeholder="This is a one-line advertisement for your store. We are going to show it as a subtitle on your page"
                maxLength={100}
                showCharacterCount
                value={tagline}
              />
              <TextField
                multiline={4}
                label="Detailed Description"
                onChange={(v) => setDescription(v)}
                autoComplete="off"
                placeholder="Feel free to elaborate your advertisement more in this section. This information will be available in your store details page in Kashee."
                maxLength={3000}
                showCharacterCount
                value={description}
              />
            </FormLayout>
          </Card>
        </Layout.AnnotatedSection>
        <Layout.AnnotatedSection
          id="storeIcon"
          title="3. Store Icon"
          description="Your app icon helps users visually recognize your app in search results, the Shopify admin, and other contexts. Dimensions: 1200px by 1200px"
        >
          {storeIconUrl?.length > 0 ? (
            <MediaCard
              title="Store Icon"
              description="We are showing this icon on many places aroung the Kashee Rewards Program. If you want to change it, just click in the button below."
              primaryAction={{
                content: 'Replace Icon',
                onAction: () => {
                  setStoreIconUrl(null);
                },
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <img
                  alt={'Icon Url'}
                  width="160px"
                  height="160px"
                  src={storeIconUrl}
                />
              </div>
            </MediaCard>
          ) : (
            <Card sectioned>
              <FormLayout>
                <p>
                  You can an icon by either filling in an Image URL or dragging
                  and drop an image from your device.
                </p>
                <TextField
                  label="Icon URL"
                  onChange={(v) => setStoreIconUrl(v)}
                  autoComplete="off"
                  placeholder="Set the Icon URL if you prefer"
                  value={storeIconUrl}
                />
                <TextStyle>
                  ... or drag and drop an image of your preference
                </TextStyle>
              </FormLayout>
              <DropZone onDrop={handleDropZoneDrop}>
                {uploadedFiles}
                {fileUpload}
              </DropZone>
            </Card>
          )}
        </Layout.AnnotatedSection>
        <Layout.AnnotatedSection
          id="backgroundImage"
          title="4. Featured Store Banner"
          description="We are going to use this image as a background when your potential customers open your Store Details page. Dimensions: 1900px by 900px"
        >
          {bannerUrl?.length > 0 ? (
            <MediaCard
              title="Featured Store Banner"
              description="We are showing this banner in your store detail page in the Kashee Rewards page. If you want to change it, just click in the button below."
              primaryAction={{
                content: 'Replace Featured Banner',
                onAction: () => {
                  setBannerUrl(null);
                },
              }}
            >
              <img
                alt={'Banner Url'}
                width="100%"
                height="100%"
                src={bannerUrl}
              />
            </MediaCard>
          ) : (
            <Card sectioned>
              <FormLayout>
                <p>
                  You can add a banner by either filling in an Image URL or
                  dragging and drop an image from your device.
                </p>
                <TextField
                  label="Banner URL"
                  onChange={(v) => setBannerUrl(v)}
                  autoComplete="off"
                  placeholder="Set the Banner URL if you prefer"
                  value={bannerUrl}
                />
                <TextStyle>
                  ... or drag and drop an image of your preference
                </TextStyle>
              </FormLayout>
              <DropZone onDrop={handleDropZoneDrop}>
                {uploadedFiles}
                {fileUpload}
              </DropZone>
            </Card>
          )}
        </Layout.AnnotatedSection>
        <Layout.AnnotatedSection
          id="featuredProducts"
          title="5. Featured Store Products"
          description="We are going to highlight your main two golden products on the listing"
        >
          <Layout>
            <ResourcePicker
              resourceType="Product"
              showVariants={true}
              open={open}
              onSelection={(resources) => handleSelection(resources)}
              onCancel={() => setOpen(false)}
              selectMultiple={1}
              allowMultiple={false}
            />
            <Layout.Section>
              <Card sectioned>
                {featuredProduct1 === null ? (
                  <Card title="Featured Product #1" sectioned>
                    <Button
                      onClick={() => {
                        setOpen(true);
                        setCurrentFeaturedProductName('featuredProduct1');
                      }}
                    >
                      Choose Product #1
                    </Button>
                  </Card>
                ) : (
                  <MediaCard
                    title={featuredProduct1.title}
                    description={featuredProduct1.description}
                    popoverActions={[
                      {
                        content: 'Choose another',
                        onAction: () => {
                          setFeaturedProduct1(null);
                        },
                      },
                    ]}
                    size="small"
                  >
                    <img
                      alt={featuredProduct1.title}
                      width="100%"
                      height="100%"
                      style={{
                        objectFit: 'cover',
                        objectPosition: 'center',
                      }}
                      src={featuredProduct1.imageUrl}
                    />
                  </MediaCard>
                )}
                <div style={{ marginTop: '20px' }}>
                  <Stack wrap={false} alignment="leading" spacing="loose">
                    <Stack.Item fill>
                      <FormLayout>
                        <FormLayout.Group condensed>
                          <TextField
                            label="Full Price"
                            prefix="US$"
                            onChange={(v) => {
                              const discountPercentage = +featuredProduct1.discountPercentage;
                              const discount = (+v / 100) * discountPercentage;
                              const price = +v - discount;
                              const saveOffPrice = +v - price;

                              setFeaturedProduct1({
                                ...featuredProduct1,
                                fullPrice: v,
                                price: price.toFixed(2),
                                saveOffPrice: saveOffPrice.toFixed(2),
                              });
                            }}
                            autoComplete="off"
                            type="number"
                            value={featuredProduct1?.fullPrice?.toString()}
                          />
                          <TextField
                            label="Discount Percentage"
                            autoComplete="off"
                            placeholder="You can set up percentage for some discount"
                            type="number"
                            onChange={(v) => {
                              const discountPercentage = +v;
                              const discount =
                                (+featuredProduct1?.fullPrice / 100) *
                                discountPercentage;
                              const price =
                                +featuredProduct1?.fullPrice - discount;
                              const saveOffPrice =
                                +featuredProduct1?.fullPrice - price;

                              setFeaturedProduct1({
                                ...featuredProduct1,
                                price: price.toFixed(2),
                                saveOffPrice: saveOffPrice.toFixed(2),
                                discountPercentage: v,
                              });
                            }}
                            max={100}
                            min={0}
                            value={featuredProduct1?.discountPercentage?.toString()}
                          />
                          <TextField
                            label="Price"
                            autoComplete="off"
                            type="number"
                            onChange={(v) => {
                              const price = +v;
                              const discountPercentage =
                                100 - (+v / featuredProduct1?.fullPrice) * 100;
                              const saveOffPrice =
                                +featuredProduct1?.fullPrice - price;

                              setFeaturedProduct1({
                                ...featuredProduct1,
                                saveOffPrice: saveOffPrice.toFixed(2),
                                discountPercentage: discountPercentage.toFixed(
                                  2
                                ),
                                price: +v,
                              });
                            }}
                            step={0.1}
                            max={+featuredProduct1?.fullPrice}
                            maxLength="3"
                            min={0}
                            prefix="US$"
                            value={featuredProduct1?.price?.toString()}
                          />
                          <TextField
                            label="SaveOff Price"
                            disabled={true}
                            prefix="US$"
                            onChange={(v) => {
                              setFeaturedProduct1({
                                ...featuredProduct1,
                                saveOffPrice: v,
                              });
                            }}
                            autoComplete="off"
                            placeholder=""
                            maxLength={50}
                            value={featuredProduct1?.saveOffPrice?.toString()}
                          />
                        </FormLayout.Group>
                      </FormLayout>
                      <div style={{ marginTop: '20px' }}>
                        <FormLayout>
                          <FormLayout.Group condensed>
                            <TextField
                              label="Category"
                              onChange={(v) => {
                                setFeaturedProduct1({
                                  ...featuredProduct1,
                                  category: v,
                                });
                              }}
                              autoComplete="off"
                              placeholder=""
                              maxLength={50}
                              value={featuredProduct1?.category}
                            />
                            <TextField
                              label="Brand"
                              onChange={(v) => {
                                setFeaturedProduct1({
                                  ...featuredProduct1,
                                  brand: v,
                                });
                              }}
                              autoComplete="off"
                              placeholder=""
                              maxLength={50}
                              value={featuredProduct1?.brand}
                            />
                          </FormLayout.Group>
                        </FormLayout>
                      </div>
                    </Stack.Item>
                  </Stack>
                </div>
              </Card>
            </Layout.Section>

            <Layout.Section>
              <Card sectioned>
                {featuredProduct2 === null ? (
                  <Card title="Featured Product #2" sectioned>
                    <Button
                      onClick={() => {
                        setOpen(true);
                        setCurrentFeaturedProductName('featuredProduct2');
                      }}
                    >
                      Choose Product #2
                    </Button>
                  </Card>
                ) : (
                  <MediaCard
                    title={featuredProduct2.title}
                    description={featuredProduct2.description}
                    popoverActions={[
                      {
                        content: 'Choose another',
                        onAction: () => {
                          setFeaturedProduct2(null);
                        },
                      },
                    ]}
                    size="small"
                  >
                    <img
                      alt={featuredProduct2.description}
                      width="100%"
                      height="100%"
                      style={{
                        objectFit: 'cover',
                        objectPosition: 'center',
                      }}
                      src={featuredProduct2.imageUrl}
                    />
                  </MediaCard>
                )}

                <div style={{ marginTop: '20px' }}>
                  <Stack wrap={false} alignment="leading" spacing="loose">
                    <Stack.Item fill>
                      <FormLayout>
                        <FormLayout.Group condensed>
                          <TextField
                            label="Full Price"
                            prefix="US$"
                            onChange={(v) => {
                              const discountPercentage = +featuredProduct2.discountPercentage;
                              const discount = (+v / 100) * discountPercentage;
                              const price = +v - discount;
                              const saveOffPrice = +v - price;

                              setFeaturedProduct2({
                                ...featuredProduct2,
                                fullPrice: v,
                                price: price.toFixed(2),
                                saveOffPrice: saveOffPrice.toFixed(2),
                              });
                            }}
                            autoComplete="off"
                            type="number"
                            value={featuredProduct2?.fullPrice?.toString()}
                          />
                          <TextField
                            label="Discount Percentage"
                            autoComplete="off"
                            placeholder="You can set up percentage for some discount"
                            type="number"
                            onChange={(v) => {
                              const discountPercentage = +v;
                              const discount =
                                (+featuredProduct2?.fullPrice / 100) *
                                discountPercentage;
                              const price =
                                +featuredProduct2?.fullPrice - discount;
                              const saveOffPrice =
                                +featuredProduct2?.fullPrice - price;

                              setFeaturedProduct2({
                                ...featuredProduct2,
                                price: price.toFixed(2),
                                saveOffPrice: saveOffPrice.toFixed(2),
                                discountPercentage: v,
                              });
                            }}
                            step={0.1}
                            max={100}
                            maxLength="3"
                            min={0}
                            value={featuredProduct2?.discountPercentage?.toString()}
                          />
                          <TextField
                            label="Price"
                            autoComplete="off"
                            type="number"
                            onChange={(v) => {
                              const price = +v;
                              const discountPercentage =
                                100 - (+v / featuredProduct2?.fullPrice) * 100;
                              const saveOffPrice =
                                +featuredProduct2?.fullPrice - price;

                              setFeaturedProduct2({
                                ...featuredProduct2,
                                saveOffPrice: saveOffPrice.toFixed(2),
                                discountPercentage: discountPercentage.toFixed(
                                  2
                                ),
                                price: +v,
                              });
                            }}
                            step={0.1}
                            max={+featuredProduct2?.fullPrice}
                            maxLength="3"
                            min={0}
                            prefix="US$"
                            value={featuredProduct2?.price?.toString()}
                          />
                          <TextField
                            label="SaveOff Price"
                            disabled={true}
                            prefix="US$"
                            onChange={(v) => {
                              setFeaturedProduct2({
                                ...featuredProduct2,
                                saveOffPrice: v,
                              });
                            }}
                            autoComplete="off"
                            placeholder=""
                            maxLength={50}
                            value={featuredProduct2?.saveOffPrice?.toString()}
                          />
                        </FormLayout.Group>
                      </FormLayout>
                      <div style={{ marginTop: '20px' }}>
                        <FormLayout>
                          <FormLayout.Group condensed>
                            <TextField
                              label="Category"
                              onChange={(v) => {
                                setFeaturedProduct2({
                                  ...featuredProduct2,
                                  category: v,
                                });
                              }}
                              autoComplete="off"
                              placeholder=""
                              maxLength={50}
                              value={featuredProduct2?.category}
                            />
                            <TextField
                              label="Brand"
                              onChange={(v) => {
                                setFeaturedProduct2({
                                  ...featuredProduct2,
                                  brand: v,
                                });
                              }}
                              autoComplete="off"
                              placeholder=""
                              maxLength={50}
                              value={featuredProduct2?.brand}
                            />
                          </FormLayout.Group>
                        </FormLayout>
                      </div>
                    </Stack.Item>
                  </Stack>
                </div>
              </Card>
            </Layout.Section>
          </Layout>
        </Layout.AnnotatedSection>
        <Layout.Section>
          <Button onClick={() => save()} fullWidth primary size="large">
            Save
          </Button>

          {toastActive ? (
            <Toast
              content="Your store listing has been saved!"
              onDismiss={() => setToastActive(false)}
            />
          ) : null}
        </Layout.Section>
      </Page>
    </Frame>
  );
};

export default Listing;
