import { Stack } from "@chakra-ui/react";
import Clock from "@/components/Home/Clock";
import Resin from "@/components/Home/Resin";
import RealmCurrency from "@/components/Home/RealmCurrency";

export default function HomePage() {
  return (
    <Stack gap={16}>
      <Clock />
      <Resin />
      <RealmCurrency />
    </Stack>
  );
}
