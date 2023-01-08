import { ResourcePicker } from '@shopify/app-bridge-react';
import {
  Button,
  Card,
  FormLayout,
  Frame,
  Heading,
  Layout,
  Page,
  SettingToggle,
  Spinner,
  Stack,
  TextField,
  TextStyle,
  Thumbnail,
  Toast,
  Modal,
  Checkbox,
  Select,
  Label,
  Badge,
  Icon,
  Tooltip,
  TextContainer,
  MediaCard,
  Caption,
} from '@shopify/polaris';
import { QuestionMarkMinor } from '@shopify/polaris-icons';
import { useCallback, useEffect, useState } from 'react';
// import {
//   SortableContainer,
//   SortableElement,
//   arrayMove,
// } from 'react-sortable-hoc';

import * as styles from '../styles/promote.module.css';
import kasheeAxios from '../wrappers/kasheeAxios';
import cookie from 'cookie';

const Index = (props) => {
  const [shopDetails, setShopDetails] = useState({});
  const [promote, setPromote] = useState({});
  const [deleteProduct, setDeleteProduct] = useState({});
  const [toastAddedActive, setToastAddedActive] = useState(false);
  const [toastUpdatedActive, setToastUpdatedActive] = useState(false);
  const [toastDeletedActive, setToastDeletedActive] = useState(false);
  const [loadingPromote, setLoadingPromote] = useState(false);
  const [deactivateButtonIsLoading, setDeactivateButtonIsLoading] = useState(
    false
  );

  const contentStatus = promote.isActive ? 'Deactivate' : 'Activate';
  const textStatus = promote.isActive ? 'activated' : 'deactivated';
  const [open, setOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(false);

  const openCloseDeleteModal = (i) => {
    setActiveModal(!activeModal);
    setDeleteProduct(i);
  };

  useEffect(() => {
    async function loadShopDetails() {
      if (Object.keys(props?.shopDetails).length != 0) {
        setShopDetails(JSON.parse(props.shopDetails));
      }
    }

    async function loadPromote() {
      setLoadingPromote(true);

      const result = await kasheeAxios.get(`promote`);

      const { data } = result;

      setPromote(data);

      setLoadingPromote(false);
    }

    loadShopDetails();
    loadPromote();
  }, []);

  const optionsForOfferType = [
    { label: 'Shopify Product', value: 'shopifyProduct' },
    { label: 'Product', value: 'product' },
  ];
  const optionsForTextAlignment = [
    { label: 'Right', value: 'right' },
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
  ];

  const handleSelectionFromShopify = (resources) => {
    setOpen(false);
    const p = formatResource(resources);

    const newProduct = promote.products.concat(p);

    const _promote = { ...promote, products: newProduct };

    setPromote(_promote);
  };

  const formatResource = (resource) => {
    const { selection } = resource;
    const _product = selection[0];

    const assets = _product.images.map((i) => ({
      assetUrl: i.originalSrc,
      type: new RegExp('.([0-9a-z]+)(?=[?#])|(.)(?:[w]+)$').exec(
        i.originalSrc
      )[0],
      displayOrder: 0,
    }));

    return {
      productId: _product.id,
      shopifyProductId: _product.id,
      title: _product.title,
      assets,
      imageUrl: _product.images[0].originalSrc,
      description: _product.descriptionHtml,
      status: 'unsaved',
      productCode: _product?.variants[0]?.sku,
      specialPrice: _product?.variants[0]?.price,
      normalPrice: _product?.variants[0]?.compareAtPrice,
      productOrder: `${promote?.products?.length + 1}`,
      offerType: 'shopifyProduct',
      textAlignment: 'right',
      showDetails: true,
      category: ['Best Deals', 'New Offers', 'Most Popular'],
    };
  };

  const saveProductHandler = async (prodToSave) => {
    promote.products.forEach(
      (element) =>
        (element.saveButtonIsLoading =
          element.productId == prodToSave.productId)
    );
    setPromote({ ...promote, products: promote.products });

    const payload = { ...prodToSave, shopDetails: shopDetails.shop };

    delete payload.saveButtonIsLoading;
    delete payload.showDetails;

    payload.status = 'active';

    if (prodToSave._id) {
      const result = await kasheeAxios.put(`promote/product`, payload);
      const { data } = result;

      promote.products.forEach((element) => {
        if (element.productId == prodToSave.productId) {
          const nProduct = data.products.find(
            (i) => i.productId == prodToSave.productId
          );
          element.saveButtonIsLoading = false;
          element.status = nProduct.status;
        }
      });

      setPromote({ ...promote, products: promote.products });

      if (data) {
        setToastUpdatedActive(true);
      }
    } else {
      await kasheeAxios.post(`promote/product`, payload).then((response) => {
        const { data } = response;
        promote.products.forEach((element) => {
          if (element.productId == prodToSave.productId) {
            const nProduct = data.products.find(
              (i) => i.productId == prodToSave.productId
            );
            element.saveButtonIsLoading = false;
            element._id = nProduct._id;
            element.status = nProduct.status;
          }
        });

        setPromote({ ...promote, products: promote.products });

        if (data) {
          setToastAddedActive(true);
        }
      });
    }
  };

  const deactivateProductHandler = async () => {
    if (!deleteProduct._id) {
      const _products = promote.products.filter(
        (element) => element.productId != deleteProduct.productId
      );
      setPromote({ ...promote, products: _products });

      setToastDeletedActive(true);
      openCloseDeleteModal();
      return;
    }

    setDeactivateButtonIsLoading(true);

    const payload = { ...deleteProduct };

    delete payload.saveButtonIsLoading;
    delete payload.showDetails;

    const result = await kasheeAxios.put(`promote/deactivate-product`, payload);
    const { status } = result;

    promote.products.forEach((element) => {
      if (element.productId == payload.productId) {
        element.status = 'deleted';
      }
    });

    setPromote({ ...promote, products: promote.products });

    setDeactivateButtonIsLoading(false);

    if (status == 200) {
      setToastDeletedActive(true);
      openCloseDeleteModal();
    }
  };

  async function activateDeactivateKasheePromote(active) {
    const result = await kasheeAxios.put(`promote/kashee-promote-status`, {
      isActive: active,
    });

    const { status } = result;
    if (status == 200) setToastUpdatedActive(true);
  }

  const handleToggleToActivateKasheePromote = useCallback(async (p) => {
    setPromote({ ...p, isActive: !p.isActive });

    await activateDeactivateKasheePromote(!p.isActive);
  }, []);

  const handleItemValue = (item, property, value) => {
    const newProductValue = promote.products.map((p) => {
      if (p.productId == item.productId) {
        p[property] = value;
      }
      return p;
    });

    const _promote = { ...promote, products: newProductValue };
    setPromote(_promote);
  };

  const handleAsset = (productReference, asset, property, value) => {
    const productAssetChanged = promote.products.map((p) => {
      if (p.productId == productReference.productId) {
        p.assets.forEach((a) => {
          if (a.assetUrl == asset.assetUrl) {
            a[property] = value;
          }
        });
      }
      return p;
    });

    const _promote = { ...promote, products: productAssetChanged };
    setPromote(_promote);
  };

  // const onSortEnd = ({ oldIndex, newIndex }, event, product) => {
  //   const newProductValue = promote.products.map((p) => {
  //     if (p.productId == product.productId) {
  //       p.category = arrayMove(p.category, oldIndex, newIndex);
  //     }
  //     return p;
  //   });

  //   const _promote = { ...promote, products: newProductValue };
  //   setPromote(_promote);
  // };

  // const SortableItem = SortableElement(({ value }) => <li>{value}</li>);

  // const SortableList = SortableContainer(({ items }) => {
  //   return (
  //     <ul className={styles.SortListUl}>
  //       {items.map((value, index) => (
  //         <SortableItem key={`item-${value}`} index={index} value={value} />
  //       ))}
  //     </ul>
  //   );
  // });

  return (
    <Frame>
      <Page title="Promote" fullWidth>
        <Layout>
          <Layout.AnnotatedSection
            id="promoteManagment"
            title="Settings"
            description="Here you can Activated or Deactivated your Kashee Promote"
          >
            <Layout.Section>
              <SettingToggle
                action={{
                  content: contentStatus,
                  onAction: () => handleToggleToActivateKasheePromote(promote),
                }}
                enabled={promote.isActive}
              >
                your Kashee Promote is{' '}
                <TextStyle variation="strong">{textStatus}</TextStyle>.
              </SettingToggle>
              <Heading>{promote.isActive}</Heading>
            </Layout.Section>
          </Layout.AnnotatedSection>
        </Layout>

        <Layout>
          <Layout.AnnotatedSection
            id="productManagment"
            title="Products"
            description="Here you can include, update or remove your Shopify product"
          >
            <Layout.Section>
              <ResourcePicker
                resourceType="Product"
                showVariants={false}
                open={open}
                onSelection={(resources) =>
                  handleSelectionFromShopify(resources)
                }
                onCancel={() => setOpen(false)}
                selectMultiple={1}
                allowMultiple={false}
              />

              <Card
                title="Products"
                actions={[
                  {
                    disabled:
                      promote.quantityProductsToAdd ==
                      promote?.products?.length,
                    content: 'Add new product',
                    onClick: () => setOpen(true),
                  },
                ]}
              >
                <Card.Section>
                  <TextStyle variation="subdued">
                    {' '}
                    {promote?.products?.length} product(s) included in promote
                  </TextStyle>
                </Card.Section>
                {promote.products?.map((i) => (
                  <Card.Section
                    title={
                      i.status == 'deleted' ? (
                        <Badge status="critical">deleted</Badge>
                      ) : i.status == 'unsaved' ? (
                        <Badge status="info">unsaved</Badge>
                      ) : (
                        <Badge status="success">active</Badge>
                      )
                    }
                    key={i.productId}
                    actions={[
                      {
                        content: `${
                          i.showDetails ? 'close details' : 'open details'
                        }`,
                        onClick: () => {
                          const newProducts = promote.products.map((ii) => {
                            ii.showDetails =
                              ii.productId == i.productId && !ii.showDetails;
                            return ii;
                          });

                          const _promote = {
                            ...promote,
                            products: newProducts,
                          };
                          setPromote(_promote);
                        },
                      },
                    ]}
                  >
                    <Stack>
                      <div style={{ display: 'inline-block', width: '80px' }}>
                        <Thumbnail
                          size="large"
                          source={i.imageUrl}
                          alt="Shopify product image"
                        />
                      </div>
                      <div style={{ display: 'inline-block', width: '550px' }}>
                        <Heading element="h1">{i.title}</Heading>
                        <p>{i.description}</p>
                      </div>
                    </Stack>
                    {i.showDetails ? (
                      <FormLayout>
                        <Stack distribution="fill">
                          <TextField
                            label="Name"
                            autoComplete="off"
                            placeholder="product tagline"
                            maxLength={50}
                            value={i.title}
                            error={!i.title ? 'Title is required' : false}
                            onChange={(v) => handleItemValue(i, 'title', v)}
                          />
                          <TextField
                            label="Display Name"
                            autoComplete="off"
                            maxLength={50}
                            onChange={(v) =>
                              handleItemValue(i, 'displayName', v)
                            }
                            value={i.displayName}
                          />
                        </Stack>
                        <Stack distribution="fill">
                          <TextField
                            suffix={
                              <Tooltip active={false} content="Headline">
                                <Icon source={QuestionMarkMinor} />
                              </Tooltip>
                            }
                            label="Headline"
                            autoComplete="off"
                            placeholder="product tagline"
                            maxLength={50}
                            value={i.detailTitle}
                            error={
                              !i.detailTitle
                                ? 'Detail Title is required'
                                : false
                            }
                            onChange={(v) =>
                              handleItemValue(i, 'detailTitle', v)
                            }
                          />
                          <TextField
                            label="Product Code"
                            suffix={
                              <Tooltip content="Product SKU" active={false}>
                                <Icon source={QuestionMarkMinor} />
                              </Tooltip>
                            }
                            autoComplete="off"
                            placeholder="Product SKU"
                            maxLength={50}
                            onChange={(v) =>
                              handleItemValue(i, 'productCode', v)
                            }
                            value={i.productCode}
                            error={
                              !i.productCode
                                ? 'Product Code is required'
                                : false
                            }
                          />
                        </Stack>

                        <Stack>
                          <Stack.Item fill>
                            <TextField
                              suffix={
                                <Tooltip content="Banner Text" active={false}>
                                  <Icon source={QuestionMarkMinor} />
                                </Tooltip>
                              }
                              label="Banner Text"
                              autoComplete="off"
                              maxLength={100}
                              onChange={(v) =>
                                handleItemValue(i, 'bannerText', v)
                              }
                              value={i.bannerText}
                              error={
                                !i.bannerText
                                  ? 'Banner Text is required'
                                  : false
                              }
                            />
                          </Stack.Item>
                        </Stack>
                        <TextField
                          multiline={2}
                          label="Description"
                          onChange={(v) => handleItemValue(i, 'description', v)}
                          autoComplete="off"
                          placeholder="Some Description"
                          maxLength={1000}
                          showCharacterCount
                          value={i.description}
                          error={
                            !i.description ? 'Description is required' : false
                          }
                        />
                        <TextField
                          multiline={2}
                          label="Detailed Description"
                          helpText="some description about this field..."
                          onChange={(v) =>
                            handleItemValue(i, 'detailDescription', v)
                          }
                          autoComplete="off"
                          placeholder="Detailed Description"
                          maxLength={1000}
                          showCharacterCount
                          value={i.detailDescription}
                          error={
                            !i.detailDescription
                              ? 'Detail Description is required'
                              : false
                          }
                        />
                        <TextField
                          multiline={1}
                          label="Short Description"
                          helpText="some description about this field..."
                          onChange={(v) =>
                            handleItemValue(i, 'shortDescription', v)
                          }
                          autoComplete="off"
                          placeholder="shortDescription."
                          maxLength={500}
                          showCharacterCount
                          value={i.shortDescription}
                          error={
                            !i.shortDescription
                              ? 'Short Description is required'
                              : false
                          }
                        />
                        <Stack distribution="fill">
                          <TextField
                            label="Referral URL"
                            placeholder="This is a Referral url"
                            autoComplete="off"
                            maxLength={250}
                            onChange={(v) =>
                              handleItemValue(i, 'referralURL', v)
                            }
                            value={i.referralURL}
                            error={
                              !i.referralURL
                                ? 'referral URL is required'
                                : false
                            }
                          />
                        </Stack>
                        <Stack distribution="fill">
                          <Select
                            label="Offer Type"
                            helpText="we need to set some help here"
                            options={optionsForOfferType}
                            onChange={(v) => handleItemValue(i, 'offerType', v)}
                            value={i.offerType}
                          />

                          <TextField
                            suffix={
                              <Tooltip content="Normal Price" active={false}>
                                <Icon source={QuestionMarkMinor} />
                              </Tooltip>
                            }
                            label="Normal Price"
                            autoComplete="off"
                            maxLength={10}
                            onChange={(v) =>
                              handleItemValue(i, 'normalPrice', v)
                            }
                            value={i.normalPrice?.toString()}
                            error={
                              !i.normalPrice
                                ? 'Normal Price is required'
                                : false
                            }
                          />
                          <TextField
                            label="Special Price"
                            suffix={
                              <Tooltip
                                content="Discounted Product Price"
                                active={false}
                              >
                                <Icon source={QuestionMarkMinor} />
                              </Tooltip>
                            }
                            autoComplete="off"
                            maxLength={10}
                            onChange={(v) =>
                              handleItemValue(i, 'specialPrice', v)
                            }
                            value={i.specialPrice?.toString()}
                            error={
                              !i.specialPrice
                                ? 'Special Price is required'
                                : false
                            }
                          />
                        </Stack>
                        <Stack distribution="fill">
                          <div style={{ width: 'auto', display: 'block' }}>
                            <Select
                              helpText="Text alignment in top product image"
                              label="Text Alignment"
                              options={optionsForTextAlignment}
                              onChange={(v) =>
                                handleItemValue(i, 'textAlignment', v)
                              }
                              value={i.textAlignment}
                            />
                          </div>
                          <TextField
                            type="number"
                            helpText="Some help text for product order"
                            label="Product Order"
                            autoComplete="off"
                            maxLength={2}
                            max="10"
                            min="1"
                            onChange={(v) =>
                              handleItemValue(i, 'productOrder', v)
                            }
                            value={i.productOrder?.toString()}
                            error={
                              !i.productOrder
                                ? 'Product Order Id is required'
                                : false
                            }
                          />
                        </Stack>
                        <br></br>
                        <Stack vertical>
                          <TextContainer>
                            {i.appIcon ? (
                              <MediaCard
                                title="Featured App Icon"
                                description="We are showing this banner in your store detail page in the Kashee Rewards page. If you want to change it, just click in the button below."
                                primaryAction={{
                                  content: 'Replace Featured App Icon',
                                  onAction: () => {
                                    handleItemValue(i, 'appIcon', null);
                                  },
                                }}
                              >
                                <img
                                  alt={'App Icon'}
                                  width="100%"
                                  height="100%"
                                  src={i.appIcon}
                                />
                              </MediaCard>
                            ) : (
                              <FormLayout>
                                <TextField
                                  label="App Icon"
                                  onChange={(v) =>
                                    handleItemValue(i, 'appIcon', v)
                                  }
                                  autoComplete="off"
                                  placeholder="Set the App Icon"
                                  value={i.appIcon}
                                  error={
                                    !i.appIcon ? 'App Icon is required' : false
                                  }
                                />
                              </FormLayout>
                            )}
                          </TextContainer>
                        </Stack>
                        <Stack vertical>
                          <TextContainer>
                            {i.imageUrl ? (
                              <MediaCard
                                title="Featured Product Image"
                                description="We are showing this banner in your store detail page in the Kashee Rewards page. If you want to change it, just click in the button below."
                                primaryAction={{
                                  content: 'Replace Product Image',
                                  onAction: () => {
                                    handleItemValue(i, 'imageUrl', null);
                                  },
                                }}
                              >
                                <img
                                  alt={'Product Image'}
                                  width="100%"
                                  height="100%"
                                  src={i.imageUrl}
                                />
                              </MediaCard>
                            ) : (
                              <FormLayout>
                                <TextField
                                  label="Product Image"
                                  onChange={(v) =>
                                    handleItemValue(i, 'imageUrl', v)
                                  }
                                  autoComplete="off"
                                  placeholder="Set the Product Image"
                                  value={i.imageUrl}
                                  error={
                                    !i.imageUrl
                                      ? 'Image Url is required'
                                      : false
                                  }
                                />
                              </FormLayout>
                            )}
                          </TextContainer>
                        </Stack>
                        <Stack vertical>
                          <TextContainer>
                            {i.emailThumbnail ? (
                              <MediaCard
                                title="Featured Email Thumbnail"
                                description="We are showing this banner in your store detail page in the Kashee Rewards page. If you want to change it, just click in the button below."
                                primaryAction={{
                                  content: 'Replace Email Thumbnail',
                                  onAction: () => {
                                    handleItemValue(i, 'emailThumbnail', null);
                                  },
                                }}
                              >
                                <img
                                  alt={'Email Thumbnail'}
                                  width="100%"
                                  height="100%"
                                  src={i.emailThumbnail}
                                />
                              </MediaCard>
                            ) : (
                              <FormLayout>
                                <TextField
                                  label="Email Thumbnail"
                                  onChange={(v) =>
                                    handleItemValue(i, 'emailThumbnail', v)
                                  }
                                  autoComplete="off"
                                  placeholder="Set the Email Thumbnail"
                                  value={i.emailThumbnail}
                                  error={
                                    !i.emailThumbnail
                                      ? 'Image Thumbnail is required'
                                      : false
                                  }
                                />
                              </FormLayout>
                            )}
                          </TextContainer>
                        </Stack>
                        <Stack vertical>
                          <TextContainer>
                            {i.logoUrl ? (
                              <MediaCard
                                title="Featured Logo Url"
                                description="We are showing this banner in your store detail page in the Kashee Rewards page. If you want to change it, just click in the button below."
                                primaryAction={{
                                  content: 'Replace Featured Banner',
                                  onAction: () => {
                                    handleItemValue(i, 'logoUrl', null);
                                  },
                                }}
                              >
                                <img
                                  alt={'Logo Url'}
                                  width="100%"
                                  height="100%"
                                  src={i.logoUrl}
                                />
                              </MediaCard>
                            ) : (
                              <FormLayout>
                                <TextField
                                  label="Logo Url"
                                  onChange={(v) =>
                                    handleItemValue(i, 'logoUrl', v)
                                  }
                                  autoComplete="off"
                                  placeholder="Set the Logo Url"
                                  value={i.logoUrl}
                                  error={
                                    !i.logoUrl ? 'Logo Url is required' : false
                                  }
                                />
                              </FormLayout>
                            )}
                          </TextContainer>
                        </Stack>
                        <Stack vertical>
                          <div style={{ display: 'inline-block' }}>
                            <Label>Category by order</Label>
                            {/* <SortableList
                              helperClass={styles.SortListItem}
                              lockAxis="y"
                              items={i.category}
                              disableAutoscroll
                              onSortEnd={(oldIndex, newIndex) =>
                                onSortEnd(oldIndex, newIndex, i)
                              }
                            /> */}
                          </div>
                          <div
                            style={{
                              color: 'var(--p-text-subdued)',
                              display: 'block',
                              marginBottom: '5px',
                            }}
                          >
                            <Caption>
                              Some explanation for this field to be set here
                            </Caption>
                          </div>
                        </Stack>
                        {i.assets.length > 0 ? (
                          <Card title="assets">
                            <Card.Section>
                              <Stack distribution="leading">
                                {i.assets.map((item) => (
                                  <div
                                    key={item.assetUrl}
                                    style={{
                                      border: '1px solid #dfe3e8',
                                      padding: '10px 3px',
                                      textAlign: 'center',
                                      borderRadius: '5px',
                                      position: 'relative',
                                    }}
                                  >
                                    <div
                                      style={{
                                        position: 'absolute',
                                        top: '15px',
                                        left: '11px',
                                      }}
                                    >
                                      <Checkbox
                                        checked={item.selected}
                                        onChange={(v) =>
                                          handleAsset(i, item, 'selected', v)
                                        }
                                        style={{
                                          backgroundColor: 'red',
                                          position: 'absolute',
                                          top: '10px',
                                        }}
                                        label=""
                                      ></Checkbox>
                                    </div>
                                    <img
                                      style={{
                                        width: '100%',
                                        maxWidth: '186px',
                                        minWidth: '186px',
                                        minHeight: '186px',
                                        maxHeight: '186px',
                                        borderRadius: '5px',
                                      }}
                                      src={item.assetUrl}
                                      alt=""
                                    ></img>
                                    <TextField
                                      label="order"
                                      min={1}
                                      type="number"
                                      value={item.displayOrder?.toString()}
                                      onChange={(v) =>
                                        handleAsset(i, item, 'displayOrder', v)
                                      }
                                      max={i.assets.length}
                                    ></TextField>
                                  </div>
                                ))}
                              </Stack>
                            </Card.Section>
                          </Card>
                        ) : (
                          ''
                        )}
                        <Stack distribution="fill">
                          <Checkbox
                            label="Indicate whether this product is top offer or not."
                            checked={i.isTop}
                            onChange={(v) => handleItemValue(i, 'isTop', v)}
                          />
                        </Stack>
                        <br></br>
                        <Stack>
                          <Stack.Item fill>
                            <Button
                              primary
                              disabled={
                                !i.title ||
                                !i.description ||
                                !i.referralURL ||
                                !i.appIcon ||
                                !i.productCode ||
                                !i.detailDescription ||
                                !i.detailTitle ||
                                !i.imageUrl ||
                                !i.shortDescription ||
                                !i.emailThumbnail ||
                                (!i.shopifyProductId &&
                                  i.offerType == 'shopifyProduct') ||
                                !i.productOrder ||
                                !i.bannerText ||
                                !i.logoUrl ||
                                !i.normalPrice ||
                                !i.specialPrice
                              }
                              loading={i.saveButtonIsLoading}
                              onClick={() => saveProductHandler(i)}
                            >
                              {i.status == 'deleted'
                                ? 'Activate and Save'
                                : 'Save product'}
                            </Button>
                          </Stack.Item>
                          <Stack.Item fill>
                            {i.status != 'deleted' ? (
                              <div
                                style={{
                                  color: 'rgb(216, 44, 13)',
                                  float: 'right',
                                }}
                              >
                                <Button
                                  destructive
                                  monochrome
                                  outline
                                  onClick={() => openCloseDeleteModal(i)}
                                >
                                  Delete
                                </Button>
                              </div>
                            ) : (
                              ''
                            )}
                          </Stack.Item>
                        </Stack>
                      </FormLayout>
                    ) : (
                      ''
                    )}
                    <Modal
                      open={activeModal}
                      onClose={() => openCloseDeleteModal(i)}
                      title="Are you sure you want to delete this product?"
                      primaryAction={{
                        content: 'Delete',
                        loading: deactivateButtonIsLoading,
                        onAction: deactivateProductHandler,
                        destructive: true,
                      }}
                      secondaryActions={{
                        content: 'Close',
                        onAction: () => openCloseDeleteModal(i),
                      }}
                    >
                      <Modal.Section>
                        <div style={{ display: 'inline-block', width: '80px' }}>
                          <Thumbnail
                            size="large"
                            source={deleteProduct?.imageUrl}
                            alt="Black choker necklace"
                          />
                        </div>
                        <div
                          style={{ display: 'inline-block', width: '550px' }}
                        >
                          <Heading element="h1">{deleteProduct?.title}</Heading>
                          <p>{deleteProduct?.description}</p>
                        </div>
                      </Modal.Section>
                    </Modal>
                  </Card.Section>
                ))}
                {loadingPromote ? (
                  <Stack distribution="center">
                    <div style={{ marginBottom: '50px' }}>
                      <Spinner
                        accessibilityLabel="Spinner example"
                        size="large"
                      />
                    </div>
                  </Stack>
                ) : (
                  ''
                )}
              </Card>
            </Layout.Section>
          </Layout.AnnotatedSection>
          {toastAddedActive ? (
            <Toast
              content="Your product has been added!"
              onDismiss={() => setToastAddedActive(false)}
            />
          ) : null}
          {toastDeletedActive ? (
            <Toast
              content="Your product has been removed!"
              onDismiss={() => setToastDeletedActive(false)}
            />
          ) : null}
          {toastUpdatedActive ? (
            <Toast
              content="Your product has been updated!"
              onDismiss={() => setToastUpdatedActive(false)}
            />
          ) : null}
        </Layout>
      </Page>
    </Frame>
  );
};

export default Index;

export async function getServerSideProps(ctx) {
  if (ctx.req && ctx.req.headers && ctx.req.headers.cookie) {
    const parsedCookies = cookie.parse(ctx.req.headers.cookie);
    return {
      props: {
        shopDetails: parsedCookies.shopDetails,
      },
    };
  }

  return {
    props: { shopDetails: {} },
  };
}
