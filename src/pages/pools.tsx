import PoolBackButton from "@/components/Atoms/PoolBackButton";
import { PoolLayout } from "@/components/Layouts/PoolLayout";
import { TitleHeader } from "@/components/Molecules/PoolHeaders/TitleHeader";
import LiquidityCard from "@/components/PoolModal/LiquidityCard";
import PoolStats from "@/components/PoolModal/PoolStats";
import SinglePoolTokens from "@/components/PoolModal/SinglePoolTokens";
import React, { useEffect } from "react";


export default function PoolPage() {

  return (
    <PoolLayout className="text-white">
      <div>
        <PoolBackButton className="mb-6" />
        <TitleHeader iconClassName="w-10 h-10" className="mb-8" />
      </div>
      <div className="flex w-full flex-col">
        <PoolStats className="mb-8" />
        <SinglePoolTokens />
      </div>
      <LiquidityCard  />
    </PoolLayout>
  );
}
