# Reja — Kompaniya API kaliti + tashqi "News Feed" API + "Consume" API

> **Maqsad (foydalanuvchi so'rovi):**
> 1. Kompaniya o'z sozlamalaridan **o'ziga API kalit yarata olsin**.
> 2. Kalit yaratilgach, **post oqimiga tushgan (delivered) xabarlar** API orqali ko'rinsin.
>    Har bir post **qaysi platforma(lar)ga chiqqani** `platforms: ["telegram","facebook","instagram"]` massivida bo'lsin.
>    **Paginatsiya** bilan, **faqat shu kompaniyaga tegishli** postlar, va **faqat API kalit** bilan ishlasin.
> 3. **Ikkinchi API:** "target source" tizim postlarni o'ziga ko'chirib olgach, o'sha `news_id` larni **massivda** yuboradi.
>    Biz ularni **"consumed"** deb belgilaymiz va **feed'dan chiqarmaymiz** (qayta ko'rsatmaymiz).

Ikkala repo o'zgaradi:
- **Backend:** `D:\personal projects\backend-ai-muxbir` (NestJS + TypeORM, `synchronize:true` + `autoLoadEntities:true` → **migration shart emas**, entity qo'shsak avtomatik jadval yaratiladi).
- **Frontend:** `D:\personal projects\muxbir-ai-front-vue` (Vue 3 `<script setup>` + Vite).

---

## 0. Arxitektura qarorlari (o'qib chiqilgan koddan)

| Savol | Qaror | Asos |
|---|---|---|
| "Post" nima? | **Bitta `source_post` (news)** — uning barcha `published_posts` (status=`sent`) yetkazishlari bo'yicha **platformalar agregatlanadi**. `news_id = source_post_id`. | Foydalanuvchi ONE post + platforms massivini so'radi. Bitta news bir nechta kanalga (tg/fb/ig) chiqishi mumkin — [`published-post.entity.ts:14`](../backend-ai-muxbir/src/bot-worker/entities/published-post.entity.ts) `@Unique(destination_channel_id, source_post_id)`. |
| Kompaniya bog'lanishi | `published_posts.destination_channel_id` → `destination_channels.company_id`. | [`destination-channel.entity.ts:24`](../backend-ai-muxbir/src/modules/web-portal/channels/entities/destination-channel.entity.ts). |
| Platforma qiymati | `destination_channels.platform_type` (`'telegram'|'facebook'|'instagram'`) — denormalizatsiya, JOIN'siz o'qiladi. | [`destination-channel.entity.ts:240`](../backend-ai-muxbir/src/modules/web-portal/channels/entities/destination-channel.entity.ts). |
| Kontent | `published_posts.ai_text` (tayyor matn) + `cover_url` (rasm) + `sent_at`. | [`published-post.entity.ts:83,108,146`](../backend-ai-muxbir/src/bot-worker/entities/published-post.entity.ts). |
| API kalit saqlash | **Alohida `company_api_keys` jadval.** Kalit **plaintext** saqlanadi (`gemini_api_key` konvensiyasi kabi) — kompaniya settings'da **istalgan vaqt qayta ko'rib/nusxalab** oladi. ✅ *(Foydalanuvchi qarori)* | Codebase allaqachon plaintext secret saqlaydi (`telegram_api_hash`, `meta_access_token`, `gemini_api_key`). Guard `where:{key}` bilan qidiradi. |
| Consumed tracking | Alohida `external_feed_consumptions` jadval `(company_id, source_post_id, consumed_at)` `@Unique`. Feed `NOT EXISTS` bilan chiqarib tashlaydi. | `source_post` global (bir nechta kompaniya bo'lishishi mumkin), shuning uchun flag `source_post`da emas, per-kompaniya junction'da. |
| Auth | Ikki xil: kompaniya kalitni **JWT** bilan boshqaradi (`/companies/:id/api-keys`); tashqi feed **`X-Api-Key`** header bilan (`/external/v1/...`). Yangi `ApiKeyGuard`. | Mavjud `JwtAuthGuard` faqat JWT ([`jwt-auth.guard.ts`](../backend-ai-muxbir/src/common/guards/jwt-auth.guard.ts)); API-key guard hozircha yo'q. |
| Feed qamrovi | `status IN ('sent','approved')` — yetkazilgan **va** tasdiqlangan (hali chiqmagan) postlar. Har item/delivery'da `status` maydoni bor. ✅ *(Foydalanuvchi qarori)* | [`published-post.entity.ts:64`](../backend-ai-muxbir/src/bot-worker/entities/published-post.entity.ts). |
| Paginatsiya | `limit`/`offset` (cap 100) — mavjud `posts` pattern'i. Javob `{ items, total, limit, offset }`. | [`posts.service.ts:135`](../backend-ai-muxbir/src/modules/web-portal/posts/posts.service.ts). |

> ✅ **Qarorlar tasdiqlandi:** (1) Kalit **plaintext** saqlanadi — settings'da qayta ko'rinadi/nusxalanadi. (2) Feed'ga `sent` **va** `approved` postlar kiradi.

---

## 1. BACKEND

### 1.1. Yangi modul strukturasi

```
src/modules/web-portal/external-api/
├── entities/
│   ├── company-api-key.entity.ts
│   └── external-feed-consumption.entity.ts
├── dto/
│   ├── create-api-key.dto.ts
│   └── consume-news.dto.ts
├── guards/
│   └── api-key.guard.ts
├── decorators/
│   └── api-company.decorator.ts
├── api-keys.service.ts          # kalit CRUD (JWT scope)
├── api-keys.controller.ts       # /companies/:id/api-keys  (JWT + Subscription)
├── external-feed.service.ts     # feed + consume mantiq
├── external-feed.controller.ts  # /external/v1/...  (ApiKeyGuard)
├── api-key.util.ts              # kalit generatsiya/hash (toza funksiyalar)
└── external-api.module.ts
```

SOLID: kalit-boshqaruv (`ApiKeysService`) va feed-o'qish (`ExternalFeedService`) alohida mas'uliyat; toza kalit-util alohida fayl; guard/decorator alohida.

---

### 1.2. Entity — `company-api-key.entity.ts`

```typescript
// src/modules/web-portal/external-api/entities/company-api-key.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
  CreateDateColumn, Index,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';

@Entity('company_api_keys')
export class CompanyApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column()
  @Index()
  company_id: string;

  /** Foydalanuvchi bergan yorliq — masalan "Sayt integratsiyasi". */
  @Column({ type: 'varchar', length: 120, default: 'API kalit' })
  name: string;

  /** Kalit plaintext (mxb_...). Settings'da qayta ko'rinadi. Guard shu bo'yicha qidiradi. */
  @Column({ type: 'varchar', length: 64, unique: true })
  @Index()
  key: string;

  @Column({ type: 'boolean', default: true })
  @Index()
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_used_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  revoked_at: Date | null;

  @CreateDateColumn()
  created_at: Date;
}
```

---

### 1.3. Entity — `external-feed-consumption.entity.ts`

```typescript
// src/modules/web-portal/external-api/entities/external-feed-consumption.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
  CreateDateColumn, Unique, Index,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';

/**
 * Tashqi "target source" tizim feed'dan olgan news_id (source_post_id) larni
 * shu yerga belgilaymiz — feed ularni boshqa qaytarmaydi (per-kompaniya).
 */
@Entity('external_feed_consumptions')
@Unique(['company_id', 'source_post_id'])
export class ExternalFeedConsumption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column()
  @Index()
  company_id: string;

  /** source_posts.id — feed'dagi news_id. */
  @Column({ type: 'uuid' })
  @Index()
  source_post_id: string;

  /** Qaysi kalit orqali olingani (audit uchun, ixtiyoriy). */
  @Column({ type: 'uuid', nullable: true })
  api_key_id: string | null;

  @CreateDateColumn()
  consumed_at: Date;
}
```

---

### 1.4. Toza util — `api-key.util.ts`

```typescript
// src/modules/web-portal/external-api/api-key.util.ts
import { randomBytes } from 'crypto';

const PREFIX = 'mxb_';

/** Yangi plaintext kalit yaratadi: "mxb_" + 32 base64url belgi. */
export function generateApiKey(): string {
  return PREFIX + randomBytes(24).toString('base64url'); // 24 bayt → 32 belgi
}
```

---

### 1.5. `ApiKeyGuard` + `@ApiCompany()` decorator

```typescript
// src/modules/web-portal/external-api/guards/api-key.guard.ts
import {
  CanActivate, ExecutionContext, Injectable, UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyApiKey } from '../entities/company-api-key.entity';

/**
 * `X-Api-Key` (yoki `Authorization: Bearer <key>`) header'ini tekshiradi.
 * Topilsa req.apiKey / req.apiCompanyId ni to'ldiradi.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @InjectRepository(CompanyApiKey)
    private readonly keysRepo: Repository<CompanyApiKey>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const raw =
      req.headers['x-api-key'] ||
      (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
    const plain = (Array.isArray(raw) ? raw[0] : raw || '').trim();
    if (!plain) throw new UnauthorizedException('API kalit yuborilmadi (X-Api-Key)');

    const key = await this.keysRepo.findOne({
      where: { key: plain, is_active: true },
    });
    if (!key) throw new UnauthorizedException('API kalit yaroqsiz yoki bekor qilingan');

    req.apiKey = key;
    req.apiCompanyId = key.company_id;
    // last_used_at — bloklamasdan yangilaymiz (fire-and-forget)
    this.keysRepo.update(key.id, { last_used_at: new Date() }).catch(() => {});
    return true;
  }
}
```

```typescript
// src/modules/web-portal/external-api/decorators/api-company.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Controller'da kompaniya ID ni ApiKeyGuard qo'ygan req.apiCompanyId dan oladi. */
export const ApiCompany = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    return ctx.switchToHttp().getRequest().apiCompanyId;
  },
);
```

---

### 1.6. DTO'lar

```typescript
// src/modules/web-portal/external-api/dto/create-api-key.dto.ts
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateApiKeyDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;
}
```

```typescript
// src/modules/web-portal/external-api/dto/consume-news.dto.ts
import { ArrayNotEmpty, ArrayMaxSize, IsArray, IsUUID } from 'class-validator';

export class ConsumeNewsDto {
  /** Feed'dan olingan news_id (source_post_id) massivi. */
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @IsUUID('all', { each: true })
  news_ids: string[];
}
```

---

### 1.7. `ApiKeysService` — kalit CRUD (JWT scope)

```typescript
// src/modules/web-portal/external-api/api-keys.service.ts
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyApiKey } from './entities/company-api-key.entity';
import { Company } from '../companies/entities/company.entity';
import { generateApiKey } from './api-key.util';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(CompanyApiKey) private readonly keysRepo: Repository<CompanyApiKey>,
    @InjectRepository(Company) private readonly companiesRepo: Repository<Company>,
  ) {}

  private async assertOwner(companyId: string, userId: string): Promise<void> {
    const company = await this.companiesRepo.findOne({ where: { id: companyId } });
    if (!company) throw new NotFoundException(`Company #${companyId} not found`);
    if (company.owner_id !== userId) throw new ForbiddenException();
  }

  /** Ro'yxat — plaintext kalit ham qaytadi (qayta ko'rish/nusxalash uchun). */
  async list(companyId: string, userId: string) {
    await this.assertOwner(companyId, userId);
    const rows = await this.keysRepo.find({
      where: { company_id: companyId },
      order: { created_at: 'DESC' },
    });
    return rows.map((k) => this.toPublic(k));
  }

  /** Yangi kalit yaratish. */
  async create(companyId: string, userId: string, name?: string) {
    await this.assertOwner(companyId, userId);
    const entity = this.keysRepo.create({
      company_id: companyId,
      name: (name || '').trim() || 'API kalit',
      key: generateApiKey(),
      is_active: true,
    });
    const saved = await this.keysRepo.save(entity);
    return this.toPublic(saved);
  }

  /** Bekor qilish (soft — is_active=false). */
  async revoke(companyId: string, userId: string, keyId: string): Promise<void> {
    await this.assertOwner(companyId, userId);
    const key = await this.keysRepo.findOne({ where: { id: keyId, company_id: companyId } });
    if (!key) throw new NotFoundException('Kalit topilmadi');
    key.is_active = false;
    key.revoked_at = new Date();
    await this.keysRepo.save(key);
  }

  private toPublic(k: CompanyApiKey) {
    return {
      id: k.id,
      name: k.name,
      key: k.key,             // plaintext — settings'da ko'rsatiladi/nusxalanadi
      is_active: k.is_active,
      last_used_at: k.last_used_at,
      revoked_at: k.revoked_at,
      created_at: k.created_at,
    };
  }
}
```

---

### 1.8. `ApiKeysController` — `/companies/:id/api-keys` (JWT + Subscription)

```typescript
// src/modules/web-portal/external-api/api-keys.controller.ts
import {
  Controller, Get, Post, Delete, Param, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../../../common/guards/subscription.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@ApiTags('company-api-keys')
@Controller('companies/:id/api-keys')
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@ApiBearerAuth()
export class ApiKeysController {
  constructor(private readonly svc: ApiKeysService) {}

  @Get()
  @ApiOperation({ summary: 'Kompaniya API kalitlari ro\'yxati (masklangan)' })
  list(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.list(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Yangi API kalit yaratish (plaintext bir marta qaytadi)' })
  create(@Param('id') id: string, @Body() dto: CreateApiKeyDto, @CurrentUser() user: any) {
    return this.svc.create(id, user.id, dto?.name);
  }

  @Delete(':keyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'API kalitni bekor qilish' })
  revoke(@Param('id') id: string, @Param('keyId') keyId: string, @CurrentUser() user: any) {
    return this.svc.revoke(id, user.id, keyId);
  }
}
```

---

### 1.9. `ExternalFeedService` — feed + consume

```typescript
// src/modules/web-portal/external-api/external-feed.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PublishedPost } from '../../../bot-worker/entities/published-post.entity';
import { SourcePost } from '../../../bot-worker/entities/source-post.entity';
import { ExternalFeedConsumption } from './entities/external-feed-consumption.entity';

@Injectable()
export class ExternalFeedService {
  constructor(
    @InjectRepository(PublishedPost) private readonly ppRepo: Repository<PublishedPost>,
    @InjectRepository(SourcePost) private readonly spRepo: Repository<SourcePost>,
    @InjectRepository(ExternalFeedConsumption)
    private readonly consRepo: Repository<ExternalFeedConsumption>,
    private readonly ds: DataSource,
  ) {}

  /** Feed'ga kiradigan statuslar — yetkazilgan va tasdiqlangan (hali chiqmagan). */
  private static readonly FEED_STATUSES = ['sent', 'approved'];

  /**
   * Kompaniyaning postlari (status ∈ sent|approved), source_post bo'yicha
   * guruhlangan; har biri platforms massivi bilan. Consumed'lar chiqarilmaydi.
   */
  async feed(companyId: string, limitRaw?: number, offsetRaw?: number) {
    const limit = Math.max(1, Math.min(100, Number(limitRaw) || 20));
    const offset = Math.max(0, Number(offsetRaw) || 0);
    const statuses = ExternalFeedService.FEED_STATUSES;

    // 1) Sahifadagi source_post_id lar (eng oxirgi bo'yicha), consumed'siz.
    const pageRows: Array<{ source_post_id: string; last_sent: string }> =
      await this.ppRepo
        .createQueryBuilder('pp')
        .innerJoin('destination_channels', 'dc', 'dc.id = pp.destination_channel_id')
        .select('pp.source_post_id', 'source_post_id')
        .addSelect('MAX(pp.sent_at)', 'last_sent')
        .where('dc.company_id = :cid', { cid: companyId })
        .andWhere('pp.status IN (:...statuses)', { statuses })
        .andWhere(
          `NOT EXISTS (SELECT 1 FROM external_feed_consumptions efc
             WHERE efc.company_id = :cid AND efc.source_post_id = pp.source_post_id)`,
          { cid: companyId },
        )
        .groupBy('pp.source_post_id')
        .orderBy('MAX(pp.sent_at)', 'DESC')
        .limit(limit)
        .offset(offset)
        .getRawMany();

    // 2) Umumiy son (paginatsiya UI uchun).
    const totalRow = await this.ppRepo
      .createQueryBuilder('pp')
      .innerJoin('destination_channels', 'dc', 'dc.id = pp.destination_channel_id')
      .select('COUNT(DISTINCT pp.source_post_id)', 'cnt')
      .where('dc.company_id = :cid', { cid: companyId })
      .andWhere('pp.status IN (:...statuses)', { statuses })
      .andWhere(
        `NOT EXISTS (SELECT 1 FROM external_feed_consumptions efc
           WHERE efc.company_id = :cid AND efc.source_post_id = pp.source_post_id)`,
        { cid: companyId },
      )
      .getRawOne<{ cnt: string }>();
    const total = Number(totalRow?.cnt || 0);

    const ids = pageRows.map((r) => r.source_post_id);
    if (!ids.length) return { items: [], total, limit, offset };

    // 3) Shu source_post'lar uchun barcha yetkazishlar (platforma + kanal + matn + status).
    const deliveries = await this.ppRepo
      .createQueryBuilder('pp')
      .innerJoin('destination_channels', 'dc', 'dc.id = pp.destination_channel_id')
      .select([
        'pp.source_post_id AS source_post_id',
        'pp.ai_text AS ai_text',
        'pp.cover_url AS cover_url',
        'pp.sent_at AS sent_at',
        'pp.delivered_at AS delivered_at',
        'pp.status AS status',
        'pp.sent_message_id AS sent_message_id',
        'dc.platform_type AS platform_type',
        'dc.username AS channel_username',
        'dc.display_name AS channel_name',
      ])
      .where('pp.source_post_id IN (:...ids)', { ids })
      .andWhere('pp.status IN (:...statuses)', { statuses })
      .andWhere('dc.company_id = :cid', { cid: companyId })
      .orderBy('pp.sent_at', 'ASC')
      .getRawMany();

    // 4) Manba matni (AI matn yo'q bo'lsa fallback uchun).
    const sources = await this.spRepo.findByIds(ids);
    const srcMap = new Map(sources.map((s) => [s.id, s]));

    // 5) source_post bo'yicha guruhlash → platforms massivi + deliveries.
    const byNews = new Map<string, any>();
    for (const d of deliveries) {
      let item = byNews.get(d.source_post_id);
      if (!item) {
        const src = srcMap.get(d.source_post_id);
        item = {
          news_id: d.source_post_id,
          text: d.ai_text || src?.text || null,
          image_url: d.cover_url || src?.media_url || null,
          published_at: d.delivered_at || d.sent_at,
          platforms: [] as string[],
          deliveries: [] as any[],
        };
        byNews.set(d.source_post_id, item);
      }
      if (d.platform_type && !item.platforms.includes(d.platform_type)) {
        item.platforms.push(d.platform_type);
      }
      item.deliveries.push({
        platform: d.platform_type,
        channel: d.channel_username || d.channel_name || null,
        status: d.status,                         // 'sent' | 'approved'
        text: d.ai_text || null,
        image_url: d.cover_url || null,
        message_id: d.sent_message_id || null,
        delivered_at: d.delivered_at || null,
      });
    }

    // pageRows tartibini saqlash (last_sent DESC).
    const items = pageRows.map((r) => byNews.get(r.source_post_id)).filter(Boolean);
    return { items, total, limit, offset };
  }

  /**
   * Tashqi tizim olib bo'lgan news_id larni consumed deb belgilaydi (idempotent upsert).
   * Belgilangandan keyin feed ularni qaytarmaydi.
   */
  async consume(companyId: string, apiKeyId: string | null, newsIds: string[]) {
    const unique = [...new Set(newsIds)];
    if (!unique.length) return { consumed: 0, total_marked: 0 };

    const rows = unique.map((sid) => ({
      company_id: companyId,
      source_post_id: sid,
      api_key_id: apiKeyId,
    }));

    // Idempotent: dublikatlarni jimgina o'tkazib yuboradi (@Unique bo'yicha).
    const res = await this.consRepo
      .createQueryBuilder()
      .insert()
      .into(ExternalFeedConsumption)
      .values(rows)
      .orIgnore() // Postgres: ON CONFLICT DO NOTHING
      .execute();

    const totalMarked = await this.consRepo.count({ where: { company_id: companyId } });
    return { consumed: res.identifiers?.filter(Boolean).length ?? 0, total_marked: totalMarked };
  }
}
```

> **Eslatma:** `.orIgnore()` TypeORM'da Postgres uchun `ON CONFLICT DO NOTHING` hosil qiladi — `@Unique(company_id, source_post_id)` tufayli qayta yuborilgan id'lar xato bermaydi (idempotentlik).

---

### 1.10. `ExternalFeedController` — `/external/v1/...` (ApiKeyGuard)

```typescript
// src/modules/web-portal/external-api/external-feed.controller.ts
import {
  Controller, Get, Post, Query, Body, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { ApiKeyGuard } from './guards/api-key.guard';
import { ApiCompany } from './decorators/api-company.decorator';
import { ExternalFeedService } from './external-feed.service';
import { ConsumeNewsDto } from './dto/consume-news.dto';

@ApiTags('external-feed')
@ApiSecurity('api-key') // Swagger: X-Api-Key header
@Controller('external/v1')
@UseGuards(ApiKeyGuard)
export class ExternalFeedController {
  constructor(private readonly svc: ExternalFeedService) {}

  @Get('news')
  @ApiOperation({ summary: 'Kompaniyaning yetkazilgan postlari (platforms massivi bilan), paginatsiya' })
  @ApiQuery({ name: 'limit', required: false, description: '1..100, default 20' })
  @ApiQuery({ name: 'offset', required: false, description: 'default 0' })
  news(
    @ApiCompany() companyId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.svc.feed(companyId, Number(limit), Number(offset));
  }

  @Post('news/consume')
  @ApiOperation({ summary: 'Olib bo\'lingan news_id larni belgilash — feed ularni boshqa qaytarmaydi' })
  consume(@ApiCompany() companyId: string, @Body() dto: ConsumeNewsDto, @Req() req: any) {
    return this.svc.consume(companyId, req.apiKey?.id ?? null, dto.news_ids);
  }
}
```

---

### 1.11. Modul — `external-api.module.ts`

```typescript
// src/modules/web-portal/external-api/external-api.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyApiKey } from './entities/company-api-key.entity';
import { ExternalFeedConsumption } from './entities/external-feed-consumption.entity';
import { Company } from '../companies/entities/company.entity';
import { PublishedPost } from '../../../bot-worker/entities/published-post.entity';
import { SourcePost } from '../../../bot-worker/entities/source-post.entity';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysController } from './api-keys.controller';
import { ExternalFeedService } from './external-feed.service';
import { ExternalFeedController } from './external-feed.controller';
import { ApiKeyGuard } from './guards/api-key.guard';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module'; // SubscriptionGuard uchun

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompanyApiKey,
      ExternalFeedConsumption,
      Company,
      PublishedPost,
      SourcePost,
    ]),
    SubscriptionsModule, // ApiKeysController SubscriptionGuard ishlatadi
  ],
  controllers: [ApiKeysController, ExternalFeedController],
  providers: [ApiKeysService, ExternalFeedService, ApiKeyGuard],
})
export class ExternalApiModule {}
```

> `SubscriptionGuard` `SubscriptionsService` ga bog'liq — u `SubscriptionsModule` da `export` qilinganini tekshiring. Agar `export` bo'lmasa, `channels.module.ts` da guard'ni provider sifatida bergani (ko'rilgan pattern) kabi qiling, yoki `SubscriptionsModule` `exports` ga qo'shing.

### 1.12. `web-portal.module.ts` ga ulash

```typescript
// src/modules/web-portal/web-portal.module.ts  — imports massiviga qo'shing:
import { ExternalApiModule } from './external-api/external-api.module';
// ...
imports: [
  // ...mavjudlar
  SupportChatModule,
  ExternalApiModule,   // ← YANGI
],
```

`autoLoadEntities:true` + `synchronize:true` ([`app.module.ts:23`](../backend-ai-muxbir/src/app.module.ts)) → `company_api_keys` va `external_feed_consumptions` jadvallari server ishga tushganda avtomatik yaratiladi. **Migration yozish shart emas** (production'da migration'ga o'tilsa — ikkita `CREATE TABLE` migration qo'shiladi).

---

### 1.13. Backend API kontrakt (yakuniy)

**Kalit boshqaruv (JWT):**
```
GET    /companies/:id/api-keys           → [{id,name,key:"mxb_...",is_active,last_used_at,created_at}]
POST   /companies/:id/api-keys  {name?}  → {id,name,key:"mxb_...",is_active,...}
DELETE /companies/:id/api-keys/:keyId    → 204
```
> `key` plaintext — ro'yxatda ham qaytadi (foydalanuvchi qayta ko'rib/nusxalab oladi).

**Tashqi feed (X-Api-Key):**
```
GET  /external/v1/news?limit=20&offset=0
Header: X-Api-Key: mxb_xxxxxxxx
→ {
    "items": [
      {
        "news_id": "uuid",
        "text": "AI qayta yozilgan matn",
        "image_url": "https://.../cover.jpg",
        "published_at": "2026-07-03T09:00:00.000Z",
        "platforms": ["telegram","facebook","instagram"],
        "deliveries": [
          {"platform":"telegram","channel":"@kanal","status":"sent","text":"...","image_url":"...","message_id":"123","delivered_at":"..."},
          {"platform":"facebook","channel":"Sahifa","status":"approved","text":"...","image_url":"...","message_id":null,"delivered_at":null}
        ]
      }
    ],
    "total": 42, "limit": 20, "offset": 0
  }

POST /external/v1/news/consume
Header: X-Api-Key: mxb_xxxxxxxx
Body: { "news_ids": ["uuid1","uuid2"] }
→ { "consumed": 2, "total_marked": 57 }
```

---

## 2. FRONTEND

### 2.1. API qatlami — `src/api/companies.js` ga qo'shish

```javascript
// src/api/companies.js — companiesApi obyektiga qo'shing:
export const companiesApi = {
  // ...mavjudlar (getMy, getTelegramApi, ...)

  // ── API kalitlar ──
  listApiKeys: (id) => http.get(`/companies/${id}/api-keys`).then(r => r.data),
  createApiKey: (id, payload) => http.post(`/companies/${id}/api-keys`, payload).then(r => r.data),
  revokeApiKey: (id, keyId) => http.delete(`/companies/${id}/api-keys/${keyId}`).then(r => r.data),
}
```

> Tashqi `/external/v1/*` endpointlari **frontend'dan chaqirilmaydi** — ular tashqi "target source" tizim uchun. Frontend faqat kalit boshqaruvi + hujjat/namuna ko'rsatadi.

---

### 2.2. Yangi komponent — `src/views/client/ClientApiKeys.vue`

`ClientTelegramApi.vue` uslubiga (padding, max-width, AppPanel) va `AdminCompanies.vue` modal patternига mos. ~250 qator.

```vue
<!-- src/views/client/ClientApiKeys.vue -->
<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;max-width:880px;">
    <PageHeader :title="tt('apiKeys.pageTitle')" :subtitle="tt('apiKeys.pageSubtitle')" />

    <div v-if="error" style="padding:10px 14px;border-radius:8px;background:var(--danger-bg);color:var(--danger);font-size:13px;">
      {{ error }}
    </div>

    <!-- Ro'yxat + yaratish. Kalit plaintext — istalgan vaqt ko'rinadi/nusxalanadi. -->
    <AppPanel :title="tt('apiKeys.listTitle')" :subtitle="tt('apiKeys.listHint')">
      <template #header-actions>
        <AppButton variant="primary" size="md" :loading="creating" @click="openCreate">
          {{ tt('apiKeys.createBtn') }}
        </AppButton>
      </template>

      <div v-if="loading" style="padding:20px;color:var(--text-2);">{{ tt('common.loading') }}</div>
      <div v-else-if="!keys.length" style="padding:20px;color:var(--text-2);">{{ tt('apiKeys.empty') }}</div>

      <div v-else style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;min-width:640px;">
          <thead>
            <tr style="text-align:left;color:var(--text-2);">
              <th style="padding:8px 6px;">{{ tt('apiKeys.colName') }}</th>
              <th style="padding:8px 6px;">{{ tt('apiKeys.colKey') }}</th>
              <th style="padding:8px 6px;">{{ tt('apiKeys.colStatus') }}</th>
              <th style="padding:8px 6px;">{{ tt('apiKeys.colUsed') }}</th>
              <th style="padding:8px 6px;"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="k in keys" :key="k.id" style="border-top:1px solid var(--border);">
              <td style="padding:10px 6px;">{{ k.name }}</td>
              <td style="padding:10px 6px;">
                <div style="display:flex;gap:6px;align-items:center;">
                  <code style="font-family:monospace;word-break:break-all;">{{ revealed[k.id] ? k.key : maskKey(k.key) }}</code>
                  <AppButton variant="ghost" size="sm" @click="revealed[k.id] = !revealed[k.id]">
                    {{ tt(revealed[k.id] ? 'apiKeys.hide' : 'apiKeys.show') }}
                  </AppButton>
                  <AppButton variant="ghost" size="sm" @click="copyKey(k)">
                    {{ tt(copiedId === k.id ? 'apiKeys.copied' : 'apiKeys.copy') }}
                  </AppButton>
                </div>
              </td>
              <td style="padding:10px 6px;">
                <AppBadge :tone="k.is_active ? 'success' : 'muted'" dot>
                  {{ tt(k.is_active ? 'apiKeys.active' : 'apiKeys.revoked') }}
                </AppBadge>
              </td>
              <td style="padding:10px 6px;color:var(--text-2);">{{ k.last_used_at ? fmtDate(k.last_used_at) : '—' }}</td>
              <td style="padding:10px 6px;text-align:right;">
                <AppButton v-if="k.is_active" variant="danger" size="sm" @click="revoke(k)">
                  {{ tt('apiKeys.revokeBtn') }}
                </AppButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppPanel>

    <!-- Hujjat: qanday ishlatish -->
    <AppPanel :title="tt('apiKeys.docsTitle')" :subtitle="tt('apiKeys.docsHint')">
      <pre style="margin:0;padding:12px;border-radius:8px;background:var(--bg-2);overflow-x:auto;font-size:12px;line-height:1.6;">GET  {{ baseUrl }}/external/v1/news?limit=20&amp;offset=0
Header: X-Api-Key: mxb_xxxxxxxx

POST {{ baseUrl }}/external/v1/news/consume
Header: X-Api-Key: mxb_xxxxxxxx
Body: { "news_ids": ["id1","id2"] }</pre>
    </AppPanel>

    <!-- Yaratish modal (nom) -->
    <AppModal v-model="createOpen" :title="tt('apiKeys.createTitle')" width="480px">
      <div style="display:flex;flex-direction:column;gap:8px;">
        <label style="font-size:12px;color:var(--text-2);">{{ tt('apiKeys.nameLabel') }}</label>
        <AppInput v-model="newName" :placeholder="tt('apiKeys.namePlaceholder')" />
      </div>
      <template #footer>
        <AppButton variant="ghost" size="md" @click="createOpen = false">{{ tt('common.cancel') }}</AppButton>
        <AppButton variant="primary" size="md" :loading="creating" @click="doCreate">{{ tt('apiKeys.createBtn') }}</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { companiesApi } from '@/api/companies'
import PageHeader from '@/components/layout/PageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppBadge from '@/components/ui/AppBadge.vue'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const company = ref(null)
const keys = ref([])
const loading = ref(true)
const error = ref('')
const creating = ref(false)
const createOpen = ref(false)
const newName = ref('')
const revealed = ref({})     // { [keyId]: bool }
const copiedId = ref('')

const baseUrl = computed(() => window.location.origin.replace(/\/$/, '') + '/api')

function fmtDate(d) { return new Date(d).toLocaleString() }
function maskKey(k) { return k ? k.slice(0, 8) + '…' + k.slice(-4) : '' }

onMounted(async () => {
  try {
    const list = await companiesApi.getMy().catch(() => [])
    const arr = Array.isArray(list) ? list : [list].filter(Boolean)
    company.value = arr[0] || null
    if (company.value) await load()
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  } finally {
    loading.value = false
  }
})

async function load() {
  keys.value = await companiesApi.listApiKeys(company.value.id)
}

function openCreate() { newName.value = ''; createOpen.value = true }

async function doCreate() {
  if (!company.value) return
  try {
    creating.value = true
    error.value = ''
    const res = await companiesApi.createApiKey(company.value.id, { name: newName.value })
    createOpen.value = false
    revealed.value[res.id] = true      // yangi kalitni ochiq ko'rsatamiz
    await load()
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  } finally {
    creating.value = false
  }
}

async function revoke(k) {
  if (!confirm(tt('apiKeys.revokeConfirm'))) return
  try {
    await companiesApi.revokeApiKey(company.value.id, k.id)
    await load()
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  }
}

async function copyKey(k) {
  try { await navigator.clipboard.writeText(k.key); copiedId.value = k.id } catch {}
}
</script>
```

> **Tekshirish kerak:** `AppPanel` da `#header-actions` slot bormi? Yo'q bo'lsa — tugmani panel ustiga alohida `div` da qo'ying (frontend explore `ClientTeam.vue` da tugma patternini ko'rsatgan). `PageHeader` yo'li aniqlansin (`@/components/layout/PageHeader.vue`).

---

### 2.3. `ClientSettings.vue` ga tab qo'shish

```vue
<!-- src/views/client/ClientSettings.vue -->
<!-- template ga: -->
<ClientApiKeys v-else-if="tab === 'api-keys'" />

<!-- script ga: -->
import ClientApiKeys from './ClientApiKeys.vue'

const tabs = computed(() => [
  { value: 'telegram-api', label: tt('settings.tab.telegram') },
  { value: 'ai-prompt',    label: tt('settings.tab.ai') },
  { value: 'timezone',     label: tt('settings.tab.timezone') },
  { value: 'api-keys',     label: tt('settings.tab.apiKeys') },  // ← YANGI
])
const validTabs = ['telegram-api', 'ai-prompt', 'timezone', 'api-keys']  // ← qo'shildi
```

---

### 2.4. i18n — `src/i18n/index.js` (uz / ru / en — UCHALASI)

**uz bloki:**
```javascript
'settings.tab.apiKeys': 'API kalitlar',
'apiKeys.pageTitle': 'API kalitlar',
'apiKeys.pageSubtitle': 'Tashqi tizimlar uchun API kalit yarating va boshqaring.',
'apiKeys.listTitle': 'Kalitlar',
'apiKeys.listHint': 'Faqat faol kalitlar API\'ga kira oladi.',
'apiKeys.createBtn': 'Yangi kalit',
'apiKeys.createTitle': 'Yangi API kalit',
'apiKeys.nameLabel': 'Nomi',
'apiKeys.namePlaceholder': 'Masalan: Sayt integratsiyasi',
'apiKeys.empty': 'Hali API kalit yaratilmagan.',
'apiKeys.colName': 'Nomi',
'apiKeys.colKey': 'Kalit',
'apiKeys.colStatus': 'Holat',
'apiKeys.colUsed': 'Oxirgi ishlatilgan',
'apiKeys.active': 'Faol',
'apiKeys.revoked': 'Bekor qilingan',
'apiKeys.revokeBtn': 'Bekor qilish',
'apiKeys.revokeConfirm': 'Kalitni bekor qilasizmi? Bu kalit bilan ishlash to\'xtaydi.',
'apiKeys.show': 'Ko\'rsatish',
'apiKeys.hide': 'Yashirish',
'apiKeys.copy': 'Nusxalash',
'apiKeys.copied': 'Nusxalandi',
'apiKeys.docsTitle': 'API dan foydalanish',
'apiKeys.docsHint': 'Postlarni olish va olinganini belgilash uchun.',
```

**ru bloki** (xuddi shu kalitlar):
```javascript
'settings.tab.apiKeys': 'API-ключи',
'apiKeys.pageTitle': 'API-ключи',
'apiKeys.pageSubtitle': 'Создавайте и управляйте API-ключами для внешних систем.',
'apiKeys.listTitle': 'Ключи',
'apiKeys.listHint': 'Только активные ключи имеют доступ к API.',
'apiKeys.createBtn': 'Новый ключ',
'apiKeys.createTitle': 'Новый API-ключ',
'apiKeys.nameLabel': 'Название',
'apiKeys.namePlaceholder': 'Например: Интеграция сайта',
'apiKeys.empty': 'API-ключи ещё не созданы.',
'apiKeys.colName': 'Название',
'apiKeys.colKey': 'Ключ',
'apiKeys.colStatus': 'Статус',
'apiKeys.colUsed': 'Последнее использование',
'apiKeys.active': 'Активен',
'apiKeys.revoked': 'Отозван',
'apiKeys.revokeBtn': 'Отозвать',
'apiKeys.revokeConfirm': 'Отозвать ключ? Работа с этим ключом прекратится.',
'apiKeys.show': 'Показать',
'apiKeys.hide': 'Скрыть',
'apiKeys.copy': 'Копировать',
'apiKeys.copied': 'Скопировано',
'apiKeys.docsTitle': 'Использование API',
'apiKeys.docsHint': 'Для получения постов и отметки полученных.',
```

**en bloki** (xuddi shu kalitlar):
```javascript
'settings.tab.apiKeys': 'API keys',
'apiKeys.pageTitle': 'API keys',
'apiKeys.pageSubtitle': 'Create and manage API keys for external systems.',
'apiKeys.listTitle': 'Keys',
'apiKeys.listHint': 'Only active keys can access the API.',
'apiKeys.createBtn': 'New key',
'apiKeys.createTitle': 'New API key',
'apiKeys.nameLabel': 'Name',
'apiKeys.namePlaceholder': 'e.g. Website integration',
'apiKeys.empty': 'No API keys yet.',
'apiKeys.colName': 'Name',
'apiKeys.colKey': 'Key',
'apiKeys.colStatus': 'Status',
'apiKeys.colUsed': 'Last used',
'apiKeys.active': 'Active',
'apiKeys.revoked': 'Revoked',
'apiKeys.revokeBtn': 'Revoke',
'apiKeys.revokeConfirm': 'Revoke this key? Requests with it will stop working.',
'apiKeys.show': 'Show',
'apiKeys.hide': 'Hide',
'apiKeys.copy': 'Copy',
'apiKeys.copied': 'Copied',
'apiKeys.docsTitle': 'Using the API',
'apiKeys.docsHint': 'To fetch posts and mark them as received.',
```

> Agar `common.loading` / `common.cancel` kalitlari yo'q bo'lsa — mavjudini tekshirib, kerak bo'lsa qo'shing (DRY).

---

### 2.5. Responsivlik

- `ClientApiKeys.vue` `max-width:880px` + `AppPanel` ishlatadi (mavjud infratuzilma).
- Jadval mobil'da toshib ketmasligi uchun `<table>` ni `<div style="overflow-x:auto">` ichiga o'rang (CLAUDE.md — qotirilgan keng layout global qatlam ko'rmaydi).
- Docs `<pre>` allaqachon `overflow-x:auto`.

---

## 3. Ish tartibi (implementatsiya bosqichlari)

### Backend
1. `external-api/` papkasini yarat: 2 entity, 2 DTO, util, guard, decorator.
2. `ApiKeysService` + `ApiKeysController` (kalit CRUD).
3. `ExternalFeedService` + `ExternalFeedController` (feed + consume).
4. `ExternalApiModule` → `web-portal.module.ts` ga ulash.
5. `SubscriptionsModule` `SubscriptionsService` ni `export` qilishini tasdiqlash (guard uchun).
6. Server ishga tushirish → jadvallar avtomatik yaratiladi (`synchronize:true`). Swagger'da `company-api-keys` + `external-feed` ko'rinishini tekshirish.

### Frontend
7. `companies.js` ga 3 endpoint.
8. `ClientApiKeys.vue` yaratish.
9. `ClientSettings.vue` ga tab.
10. `src/i18n/index.js` — uchala tilga kalitlar.
11. Jadvalni `overflow-x:auto` ga o'rash (responsive).

### Sinov (qo'lda)
12. Kompaniya sifatida kirib → Sozlamalar → API kalitlar → kalit yaratish → plaintext bir marta ko'rinishi.
13. `curl -H "X-Api-Key: mxb_..." /api/external/v1/news?limit=5` → yetkazilgan postlar + `platforms` massivi.
14. `curl -XPOST -H "X-Api-Key: mxb_..." -d '{"news_ids":["..."]}' /api/external/v1/news/consume` → keyin feed'da o'sha id chiqmasligi.
15. Boshqa kompaniya kaliti bilan — faqat o'z postlari ko'rinishini tasdiqlash (izolatsiya).

---

## 4. Qarorlar / ochiq savollar

**✅ Tasdiqlangan:**
1. **Kalit saqlash:** plaintext — settings'da qayta ko'rinadi/nusxalanadi.
2. **Feed qamrovi:** `status IN ('sent','approved')` — yetkazilgan va tasdiqlangan postlar.
3. **Feed birligi:** bitta `source_post` (news), platforms massivi bilan guruhlangan. `news_id = source_post_id`.

**❓ Hali ochiq (ixtiyoriy — hozir yo'q, keyin qo'shsa bo'ladi):**
4. **Rate limiting** kerakmi (kalit boshiga daqiqasiga N so'rov)? Reja'da yo'q — kerak bo'lsa `@nestjs/throttler`.
5. **Kalitlar soni** cheklovi (masalan kompaniyaga max N kalit)? Hozir cheksiz.
```
