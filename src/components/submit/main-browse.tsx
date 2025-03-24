"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteProblem, fetchProblems } from "@/lib/actions";
import { tagMap } from "@/lib/constants";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// 定义每页显示数量
const PER_PAGE = 15;

interface Problem {
  id: number;
  title: string;
  tag: keyof typeof tagMap;
  status: string;
  remark: string | null;
  score: number | null;
  createdAt: Date
}

function SkeletonCard() {
  return (
    <div className="mt-8 xl:mx-32 lg:mx-24 flex flex-col items-center">
      <div className="grid grid-cols-3 gap-4 w-full min-h-[50vh]">
        {Array(9).fill(0).map((_, index) => (
          <Card key={index} className="flex flex-col justify-between">
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <div className="flex flex-row gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-4/5" />
            </CardContent>
            <CardFooter className="flex flex-row justify-between items-center">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function BrowsePage({ currentPage }: { currentPage: number }) {
  // 获取题目列表与总页数
  const [problems, setProblems] = useState<Problem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [nextPage, setNextPage] = useState(currentPage);

  const [loading, setLoading] = useState(true);

  const router = useRouter();
  useEffect(() => {
    fetchProblems(currentPage, PER_PAGE).then(({ problems, totalPages }) => {
      setProblems(problems);
      setTotalPages(totalPages);
      setLoading(false);
    });
  }, [currentPage]);

  // 生成分页数组的函数
  const getPaginationItems = () => {
    if (totalPages <= 1) return [];
    const items = [];
    const showEllipsisStart = currentPage > 3;
    const showEllipsisEnd = currentPage < totalPages - 2;
    
    // 始终添加第1页
    items.push(1);
    if (showEllipsisStart) {
      items.push(-1); // -1 表示省略号
    } else {
      // 靠近开始，显示 2
      if (totalPages >= 2) items.push(2);
    }
  
    for (let i = Math.max(3, currentPage - 1); i <= Math.min(totalPages - 2, currentPage + 1); i++) {
      if (items.indexOf(i) === -1) {
        items.push(i);
      }
    }
    if (showEllipsisEnd) {
      items.push(-2); // -2 表示省略号
    } else {
      // 靠近结尾，显示倒数第二页
      if (totalPages >= 3) items.push(totalPages - 1);
    }
    if (totalPages > 1 && items.indexOf(totalPages) === -1) {
      items.push(totalPages);
    }
    return items;
  };
  const paginationItems = getPaginationItems();

  if (loading) {
    return (
      <SkeletonCard />
    );
  }

  return (
    <div className="mt-4 xl:mx-32 lg:mx-24 flex flex-col items-center">
      {/* title and add button */}
      <div className="flex flex-row justify-between w-full mb-4">
        <div>
          <h1 className="text-2xl font-bold">问题列表</h1>
          <p className="text-gray-700 dark:text-gray-300">共 {totalPages} 页 </p>
        </div>
        <Button onClick={() => {
          router.push("/submit/add");
        }} className=" cursor-pointer">
          <Plus /> 添加问题
        </Button>
      </div>

      {/* main list */}
      <div className="grid grid-cols-3 gap-4 w-full">
        {!problems.length && (
          <div className="col-span-3 text-center text-gray-500 dark:text-gray-400 h-[50vh]">
            暂无问题
          </div>
        )}
        {problems.map((problem) => (
          <Card key={problem.id} className="felx flex-col justify-between">
            <CardHeader>
              <CardTitle 
                className="leading-5 cursor-pointer hover:font-bold"
                onClick={() => router.push(`/problem/${problem.id}`)}
              >
                {problem.title}
              </CardTitle>
              <CardDescription className="flex flex-row text-sm">
                <Badge variant="secondary" className={`${tagMap[problem.tag].color} text-white`}>
                  {tagMap[problem.tag].label}
                </Badge>
                <Badge variant="secondary" >{problem.createdAt.toLocaleDateString()}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {problem.remark &&
                <p className="text-slate-700 dark:text-slate-300 text-sm">
                &quot; {problem.remark} &quot;
                </p>}
            </CardContent>
            <CardFooter className="flex flex-row justify-between items-center">
              <div
                className={
                  problem.status === "APPROVED"
                    ? "text-green-700 dark:text-green-300"
                    : problem.status === "REJECTED"
                    ? "text-red-800 dark:text-red-300"
                    : problem.status === "RETURNED"
                    ? "text-yellow-800 dark:text-yellow-300"
                    : "text-gray-600 dark:text-slate-300"
                }
              >
                {
                  problem.status === "APPROVED"
                    ? "已通过"
                    : problem.status === "REJECTED"
                    ? "已拒绝"
                    : problem.status === "RETURNED"
                    ? "已退回"
                    : "待审核"
                }
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm" className=" cursor-pointer">
                    <Trash2 />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>删除问题</DialogTitle>
                  </DialogHeader>
                  <p>
                  是否真的要删除问题 <span className="font-semibold">{problem.title}</span>？
                  </p>
                  <DialogFooter>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        deleteProblem(problem.id).then(() => {
                          // 直接更新本地状态，从列表中删除该问题
                          setProblems(problems.filter(p => p.id !== problem.id));
                          
                          // 处理边缘情况：如果当前页面已空（最后一条记录被删除）
                          if (problems.length === 1 && currentPage > 1) {
                            router.push(`/submit/${currentPage - 1}`);
                          } else {
                            router.refresh(); // 仍保留刷新以确保数据一致性
                          }
                          
                          toast.success("问题已删除");
                        }).catch(error => {
                          console.error("删除失败:", error);
                          toast.error("删除失败，请重试");
                        });
                      }}
                    >
                      删除
                    </Button>
                    <DialogClose asChild>
                      <Button>取消</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
          ))
        }
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="w-full mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href={currentPage > 1 ? `/submit/${Number(currentPage) - 1}` : '#'} 
                  isActive={Number(currentPage) > 1} 
                />
              </PaginationItem>
              
              {/* 动态生成分页项 */}
              {paginationItems.map((pageNum, index) => {
                if (pageNum < 0) {
                  // 显示省略号
                  return (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                } else {
                  // 显示页码
                  return (
                    <PaginationItem key={`page-${pageNum}`}>
                      <PaginationLink 
                        href={`/submit/${pageNum}`} 
                        isActive={pageNum === currentPage}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
              })}
              
              <PaginationItem>
                <PaginationNext 
                  href={currentPage < totalPages ? `/submit/${Number(currentPage) + 1}` : '#'} 
                  isActive={Number(currentPage) < totalPages} 
                />
              </PaginationItem>
            </PaginationContent>
            
            {/* 输入框切换页码 */}
            <div className="flex justify-center mt-2">
              <Input
                type="number"
                value={nextPage}
                min={1}
                max={totalPages}
                className="w-20 text-center"
                onChange={(e) => setNextPage(parseInt(e.target.value))}
              />
              <Button variant="secondary" size="sm" onClick={() => {
                if (nextPage >= 1 && nextPage <= totalPages) {
                  router.push(`/submit/${nextPage}`);
                }
              }}>
                跳转
              </Button>
            </div>
          </Pagination>
        </div>
      )}
    </div>
  );
}
