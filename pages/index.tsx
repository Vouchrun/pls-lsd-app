import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getTokenName } from 'utils/configUtils';

const Home: NextPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${getTokenName()}`);
  }, [router]);

  return <div></div>;
};

export default Home;
