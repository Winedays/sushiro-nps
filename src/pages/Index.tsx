import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";
import { getSurveyPages, type Region } from "@/data/questions";
import {
  REGION_CONFIG,
  VISITED_TIME_OPTIONS,
  applyUniformRadioAnswer,
  buildBestAnswers,
  buildDefaultAnswers,
  detectRegion,
  generateInvitationCode,
  generateTotalPrice,
  generateVisitedTime,
  questionCount,
  submitSurvey,
} from "@/lib/sushiro";

type SubmitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; code: string }
  | { status: "error"; message: string; detail?: unknown };

const Index = () => {
  const [region, setRegion] = useState<Region>(() => detectRegion());
  const [invitationCode, setInvitationCode] = useState<string>(() => generateInvitationCode());
  const [totalPrice, setTotalPrice] = useState<string>(() => generateTotalPrice());
  const [visitedTime, setVisitedTime] = useState<string>(() => generateVisitedTime());
  const [answers, setAnswers] = useState<Record<number, string>>(() => buildBestAnswers(region));
  const [activePreset, setActivePreset] = useState<"best" | "1" | "2" | "3" | "default" | null>("best");
  const [showQuestions, setShowQuestions] = useState(false);
  const [submit, setSubmit] = useState<SubmitState>({ status: "idle" });

  const pages = useMemo(() => getSurveyPages(region), [region]);
  const counts = useMemo(() => questionCount(region), [region]);
  const regionCfg = REGION_CONFIG[region];
  const apiHost = regionCfg.apiHost.replace(/^https?:\/\//, "");

  const switchRegion = (next: Region) => {
    if (next === region) return;
    setRegion(next);
    setAnswers(buildBestAnswers(next));
    setActivePreset("best");
    setSubmit({ status: "idle" });
    toast({ title: `已切換至 ${REGION_CONFIG[next].label} 問卷` });
  };

  const rerollBasics = () => {
    setInvitationCode(generateInvitationCode());
    setTotalPrice(generateTotalPrice());
    setVisitedTime(generateVisitedTime());
  };

  const resetAllAnswers = () => {
    setAnswers(buildDefaultAnswers(region));
    setActivePreset("default");
    toast({ title: "已重置為預設答案（全部 option 1）" });
  };

  const setAllBest = () => {
    setAnswers(buildBestAnswers(region));
    setActivePreset("best");
    toast({ title: "已套用『全部最佳答案』" });
  };

  const setAllOption = (optionNo: "1" | "2" | "3", label: string) => {
    setAnswers((cur) => applyUniformRadioAnswer(cur, optionNo, region));
    setActivePreset(optionNo);
    toast({ title: `已將所有適用題目答為：${label}` });
  };

  const handleSubmit = async () => {
    setSubmit({ status: "loading" });
    const result = await submitSurvey({
      region,
      invitation_code: invitationCode.trim(),
      total_price: totalPrice.trim(),
      visited_time: visitedTime,
      answers,
    });
    if (result.ok === true) {
      setSubmit({ status: "success", code: result.code });
    } else {
      setSubmit({ status: "error", message: result.message, detail: result.detail });
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: `已複製認證碼 ${code}` });
    } catch {
      toast({ title: "複製失敗", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <Badge variant="secondary">Sushiro NPS · 一頁式填寫</Badge>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">地區</span>
              <div className="inline-flex overflow-hidden rounded-md border border-border">
                {(["TW", "HK"] as Region[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => switchRegion(r)}
                    className={
                      "px-3 py-1 text-sm transition-colors " +
                      (region === r
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-foreground hover:bg-accent")
                    }
                  >
                    {REGION_CONFIG[r].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            壽司郎問卷一鍵送出
          </h1>
          <p className="mt-2 text-muted-foreground">
            共 {counts.radio} 題單選 + {counts.text} 題文字。所有欄位皆已預設好，
            按下「送出問卷」即可拿到 5 碼折價券認證碼。
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            目前送出目的地：<code>{apiHost}</code>（{regionCfg.label}）。
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            ⚠ 邀請序號僅在用餐日起 6 日內有效。若失敗，請改填實體折價券上的序號與金額。
          </p>
        </header>

        {/* 基本資訊 */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>基本資訊（已自動填入）</CardTitle>
            <Button variant="outline" size="sm" onClick={rerollBasics}>
              重新隨機
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invitation_code">邀請序號 (YYMMDDXX)</Label>
                <Input
                  id="invitation_code"
                  inputMode="numeric"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_price">消費總金額</Label>
                <Input
                  id="total_price"
                  inputMode="numeric"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>用餐時間時段</Label>
              <RadioGroup
                value={visitedTime}
                onValueChange={setVisitedTime}
                className="grid grid-cols-2 gap-2 md:grid-cols-4"
              >
                {VISITED_TIME_OPTIONS.map((o) => (
                  <label
                    key={o.value}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-accent"
                  >
                    <RadioGroupItem value={o.value} />
                    <span>{o.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* 送出按鈕 */}
        <Card className="mb-6 border-primary/40 bg-primary/5">
          <CardContent className="flex flex-col items-stretch gap-3 py-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-lg font-semibold">準備好了嗎？</p>
              <p className="text-sm text-muted-foreground">
                所有題目預設為「全部最佳答案」。直接送出即可。
              </p>
            </div>
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={submit.status === "loading"}
              className="min-w-40"
            >
              {submit.status === "loading" ? "送出中…" : "送出問卷"}
            </Button>
          </CardContent>
        </Card>

        {/* 結果 */}
        {submit.status === "success" && (
          <Alert className="mb-6 border-primary/40">
            <AlertTitle className="text-base">🎉 折價券認證碼</AlertTitle>
            <AlertDescription>
              <div className="mt-3 flex items-center gap-3">
                <span className="rounded-md bg-primary px-4 py-2 font-mono text-3xl font-bold tracking-widest text-primary-foreground">
                  {submit.code}
                </span>
                <Button variant="outline" onClick={() => copyCode(submit.code)}>
                  複製
                </Button>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                請將此 5 碼填寫於實體折價券上。
              </p>
            </AlertDescription>
          </Alert>
        )}
        {submit.status === "error" && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>送出失敗</AlertTitle>
            <AlertDescription>
              <p>{submit.message}</p>
              {submit.detail ? (
                <pre className="mt-2 overflow-auto rounded bg-background/40 p-2 text-xs">
                  {JSON.stringify(submit.detail, null, 2)}
                </pre>
              ) : null}
            </AlertDescription>
          </Alert>
        )}

        {/* 題目區（預設收合） */}
        <Card>
          <Collapsible open={showQuestions} onOpenChange={setShowQuestions}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>問卷題目</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  預設隱藏。若想手動修改答案，展開後逐題調整。
                </p>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">
                  {showQuestions ? "收合" : "展開題目"}
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-6">
                {/* 一鍵批次操作 */}
                <div className="flex flex-wrap gap-2 rounded-md border border-dashed border-border p-3">
                  <span className="w-full text-xs font-medium text-muted-foreground">
                    一鍵批次填答（僅套用到有此選項的題目）
                    {activePreset && (
                      <span className="ml-2 text-primary">
                        · 目前套用：
                        {activePreset === "best"
                          ? "全部最佳答案"
                          : activePreset === "default"
                          ? "預設答案"
                          : `全部 option ${activePreset}`}
                      </span>
                    )}
                  </span>
                  <Button size="sm" variant={activePreset === "best" ? "default" : "secondary"} onClick={setAllBest}>
                    全部最佳答案
                  </Button>
                  <Button size="sm" variant={activePreset === "1" ? "default" : "secondary"} onClick={() => setAllOption("1", "option 1 / 非常滿意 / 有")}>
                    全部 option 1
                  </Button>
                  <Button size="sm" variant={activePreset === "2" ? "default" : "secondary"} onClick={() => setAllOption("2", "option 2 / 滿意 / 沒有")}>
                    全部 option 2
                  </Button>
                  <Button size="sm" variant={activePreset === "3" ? "default" : "secondary"} onClick={() => setAllOption("3", "option 3")}>
                    全部 option 3
                  </Button>
                  <Button size="sm" variant="ghost" onClick={resetAllAnswers}>
                    重置預設
                  </Button>
                </div>

                {pages.map((page, pageIdx) => (
                  <div key={page.page_id} className="space-y-4">
                    {pageIdx > 0 && <Separator />}
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Page {pageIdx + 1}</Badge>
                        <h3 className="text-base font-semibold">{page.page_name}</h3>
                      </div>
                      {page.display_title && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {page.display_title}
                        </p>
                      )}
                    </div>

                    {page.questions.map((q) => (
                      <div key={q.question_id} className="rounded-md border border-border p-4">
                        <div className="mb-3 text-sm font-medium">
                          Q{q.question_no}. {q.content}
                          {q.is_required && (
                            <span className="ml-1 text-destructive">*</span>
                          )}
                        </div>
                        {q.form_type === 1 ? (
                          <RadioGroup
                            value={answers[q.question_id] ?? ""}
                            onValueChange={(v) => {
                              setAnswers((cur) => ({ ...cur, [q.question_id]: v }));
                              setActivePreset(null);
                            }}
                            className="grid gap-2 md:grid-cols-2"
                          >
                            {q.options.map((o) => (
                              <label
                                key={o.option_no}
                                className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-accent"
                              >
                                <RadioGroupItem value={o.option_no} />
                                <span>
                                  <span className="mr-1 text-muted-foreground">
                                    [{o.option_no}]
                                  </span>
                                  {o.content}
                                </span>
                              </label>
                            ))}
                          </RadioGroup>
                        ) : (
                          <Textarea
                            value={answers[q.question_id] ?? ""}
                            onChange={(e) => {
                              setAnswers((cur) => ({
                                ...cur,
                                [q.question_id]: e.target.value,
                              }));
                              setActivePreset(null);
                            }}
                            placeholder="（可留白）"
                            rows={3}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        <footer className="mt-8 text-center text-xs text-muted-foreground">
          非官方工具。本頁面僅將官方多頁問卷壓縮為單頁；資料直接送至{" "}
          <code>{apiHost}</code>。
        </footer>
      </div>
    </div>
  );
};

export default Index;
