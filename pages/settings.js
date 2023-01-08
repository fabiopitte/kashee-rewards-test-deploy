import {
  Card,
  FormLayout,
  Frame,
  Heading,
  Layout,
  Page,
  SettingToggle,
  TextField,
  TextStyle,
  Toast,
} from '@shopify/polaris';
import { useCallback, useEffect, useState } from 'react';
import kasheeAxios from '../wrappers/kasheeAxios';

const Settings = () => {
  useEffect(() => {
    getStoreDetails();
  }, []);

  const getStoreDetails = async () => {
    const result = await kasheeAxios.get('store');
    console.log(
      'file: settings.js > line 22 > getStoreDetails > result',
      result
    );

    const { data } = result;

    if (data) {
      setMaximumCap(data.maximumCap);
      setActive(data.isActive);
    }
  };

  const [active, setActive] = useState(false);
  const [maximumCap, setMaximumCap] = useState(10);
  const [toastActive, setToastActive] = useState(false);

  const handleToggle = useCallback(() => setActive((active) => !active), []);

  const contentStatus = active ? 'Deactivate' : 'Activate';
  const textStatus = active ? 'activated' : 'deactivated';

  const save = async () => {
    const payload = {
      isActive: active,
      maximumCap: +maximumCap,
    };

    const result = await kasheeAxios.post('store/settings', payload);
    if (result) {
      setToastActive(true);
    }
  };

  return (
    <Frame>
      <Page
        title="Your Store Settings"
        fullWidth
        primaryAction={{
          content: 'Save',
          onAction: () => save(),
        }}
      >
        <Layout>
          <Layout.Section sectioned>
            <p>
              In this section you will find some Kashee Rewards settings
              regarding to your store.
            </p>
          </Layout.Section>
        </Layout>
        <Layout.AnnotatedSection
          id="isActivated"
          title="1. Activate your Store"
          description="Your store can be deactivate for a while if don't want to receive new discount codes from Kashee Rewards. If your store is deactivated, it will be not visible to the Kashee Rewards members as well"
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
          id="maximumCap"
          title="2. Maximum Cap"
          description="You can define the Maximum Cap for Discount Codes created by Kashee Rewards. This way we will not create discount codes that are greater than you desire."
        >
          <Card sectioned>
            <FormLayout>
              <TextField
                type="number"
                label="Maximum Cap"
                onChange={(v) => setMaximumCap(v)}
                autoComplete={false}
                value={maximumCap.toString()}
              />
            </FormLayout>
          </Card>
          {toastActive ? (
            <Toast
              content="Your store settings has been saved!"
              onDismiss={() => setToastActive(false)}
            />
          ) : null}
        </Layout.AnnotatedSection>
      </Page>
    </Frame>
  );
};

export default Settings;
