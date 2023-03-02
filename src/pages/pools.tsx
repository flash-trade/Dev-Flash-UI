import PoolBackButton from "@/components/Atoms/PoolBackButton";
import { PoolLayout } from "@/components/Layouts/PoolLayout";
import { TitleHeader } from "@/components/Molecules/PoolHeaders/TitleHeader";
import LiquidityCard from "@/components/PoolModal/LiquidityCard";
import PoolStats from "@/components/PoolModal/PoolStats";
import SinglePoolTokens from "@/components/PoolModal/SinglePoolTokens";
import { usePoolData } from "@/hooks/usePoolData";
import { ChevronLeft } from "@carbon/icons-react";




export default function PoolPage() {

  const { pool } = usePoolData();


  return (
    <PoolLayout className="text-white">
      <div>
        <PoolBackButton className="mb-6" />
        <TitleHeader iconClassName="w-10 h-10" className="mb-8" />
      </div>
      <div className="flex w-full flex-col">
        <PoolStats pool={pool!} className="mb-8" />
        <SinglePoolTokens pool={pool!} />
      </div>
      <LiquidityCard pool={pool} />
    </PoolLayout>
  );
}
