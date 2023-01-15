import React, { memo } from "react";
import { createApiClient, User, WebData } from "../../utils/api";
import { GetServerSideProps } from "next";
import ConfigProvider from "../../components/ConfigProvider";
import Layout from "../../components/Layout";
import SettingsList from "../../components/Customize/SettingsList";
import { Language } from "../../langs";

type Props = {
  language: Language | null;
  user: User | null;
  data: WebData | null;
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const client = createApiClient(ctx);

  if (!client.token) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      language: client.language || null,
      user: client.authenticated ? await client.getSelf() : null,
      data: client.authenticated ? await client.getSync() : null,
    },
  };
};

const Customize = ({ language, user, data }: Props) => {
  return (
    <ConfigProvider initial={data} language={language}>
      <Layout title={["Settings"]}>
        <SettingsList user={user || undefined} />
      </Layout>
    </ConfigProvider>
  );
};

export default memo(Customize);
