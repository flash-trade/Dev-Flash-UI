import { SidebarLayout } from "@/components/SidebarLayout";
import { CandlestickChart } from "@/components/CandlestickChart";
import { TradeSidebar } from "@/components/TradeSidebar";

export default function Page() {
  return (
    <SidebarLayout className="pt-11">
      <div>
        <TradeSidebar />
      </div>
      <div>
        <CandlestickChart className="h-[350px] md:h-[500px]" />
      </div>
    </SidebarLayout>
  );
}
