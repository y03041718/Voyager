# 福建POI采集服务 - 动态城市列表优化

## 修改说明

### 问题
原来的 `FujianPoiCollectorService` 使用硬编码的城市列表：
```java
private static final List<String> CITIES = Arrays.asList(
    "福州市", "厦门市", "泉州市", "漳州市", "莆田市",
    "龙岩市", "三明市", "南平市", "宁德市"
);
```

这种方式的缺点：
- 城市列表固定在代码中，不灵活
- 如果要添加或修改城市，需要修改代码并重新编译
- 城市列表与数据库数据可能不一致

### 解决方案
修改为从数据库的 `region` 表动态获取城市列表。

### 修改内容

#### 1. 移除硬编码的城市列表常量
```java
// 删除
private static final List<String> CITIES = Arrays.asList(...);
```

#### 2. 添加动态获取城市的方法
```java
/**
 * 从数据库获取福建省的城市列表
 */
private List<String> getFujianCities() {
    return regionRepository.findByProvince(PROVINCE).stream()
        .filter(r -> r.getCity() != null) // 只要城市，不要省级数据
        .map(Region::getCity)
        .collect(Collectors.toList());
}
```

#### 3. 更新 `collectAllPoisAsync()` 方法
```java
@Async
public void collectAllPoisAsync() {
    // 从数据库获取城市列表
    List<String> cities = getFujianCities();
    
    if (cities.isEmpty()) {
        log.error("数据库中没有福建省的城市数据，请先执行初始化");
        currentStatus = "failed";
        errorMessage = "数据库中没有福建省的城市数据，请先执行初始化";
        return;
    }
    
    log.info("从数据库获取到 {} 个城市", cities.size());
    
    // 遍历城市进行采集
    for (String city : cities) {
        // ...
    }
}
```

#### 4. 更新 `getCollectionStatus()` 方法
```java
public CollectionStatusResponse getCollectionStatus() {
    // 从数据库获取城市总数
    List<String> cities = getFujianCities();
    int totalCities = cities.isEmpty() ? 9 : cities.size();
    
    response.setTotalCities(totalCities);
    // ...
}
```

#### 5. 保留 `initializeFujianRegions()` 中的城市列表
```java
@Transactional
public String initializeFujianRegions() {
    // 定义福建省的9个城市（仅用于初始化）
    List<String> cities = Arrays.asList(
        "福州市", "厦门市", "泉州市", "漳州市", "莆田市",
        "龙岩市", "三明市", "南平市", "宁德市"
    );
    
    // 插入到数据库
    for (String city : cities) {
        // ...
    }
}
```

## 优势

### 1. 灵活性
- 可以通过数据库直接添加或删除城市
- 不需要修改代码和重新编译

### 2. 一致性
- 采集的城市列表与数据库中的城市数据保持一致
- 避免代码和数据不同步的问题

### 3. 可扩展性
- 如果以后要支持其他省份，只需修改 `PROVINCE` 常量
- 可以轻松扩展为通用的省份POI采集服务

### 4. 错误处理
- 如果数据库中没有城市数据，会给出明确的错误提示
- 提示用户先执行初始化操作

## 使用流程

### 1. 初始化城市数据
```bash
curl -X POST http://localhost:8080/api/fujian-poi/init-regions
```

这会向 `region` 表插入福建省和9个城市的数据。

### 2. 采集POI数据
```bash
curl -X POST http://localhost:8080/api/fujian-poi/collect-all
```

服务会：
1. 从数据库查询福建省的所有城市
2. 遍历每个城市进行POI采集
3. 保存到 `poi` 表

### 3. 添加新城市（可选）
如果要添加新城市，直接在数据库中插入：

```sql
INSERT INTO region (province, city, display_name) 
VALUES ('福建省', '平潭县', '平潭县');
```

然后重新执行采集：
```bash
curl -X POST http://localhost:8080/api/fujian-poi/collect-all
```

新城市的POI也会被采集。

### 4. 删除城市（可选）
如果要删除某个城市：

```sql
-- 删除城市的POI数据
DELETE FROM poi WHERE region_id = (
    SELECT id FROM region WHERE province = '福建省' AND city = '某城市'
);

-- 删除城市记录
DELETE FROM region WHERE province = '福建省' AND city = '某城市';
```

## 数据流

```
1. 初始化
   initializeFujianRegions()
   ↓
   插入城市数据到 region 表
   
2. 采集
   collectAllPoisAsync()
   ↓
   getFujianCities() → 从 region 表查询城市
   ↓
   遍历城市 → collectCityPois()
   ↓
   保存POI到 poi 表

3. 查询
   前端 → RegionPoiController
   ↓
   getCities() → 从 region 表查询
   ↓
   getCityPois() → 从 poi 表查询
```

## 注意事项

1. **必须先初始化**
   - 在采集之前必须先执行 `init-regions` 接口
   - 否则数据库中没有城市数据，采集会失败

2. **城市名称必须匹配**
   - 数据库中的城市名称必须与高德API支持的城市名称一致
   - 例如："福州市"、"厦门市"等

3. **数据一致性**
   - 如果手动修改了 `region` 表的城市数据
   - 建议清空 `poi` 表后重新采集

4. **性能考虑**
   - `getFujianCities()` 每次都查询数据库
   - 如果频繁调用，可以考虑添加缓存

## 扩展建议

### 支持多省份
可以将服务改造为通用的省份POI采集服务：

```java
public class RegionPoiCollectorService {
    
    public void collectProvincePois(String province) {
        List<String> cities = getCitiesByProvince(province);
        // 采集逻辑
    }
    
    private List<String> getCitiesByProvince(String province) {
        return regionRepository.findByProvince(province).stream()
            .filter(r -> r.getCity() != null)
            .map(Region::getCity)
            .collect(Collectors.toList());
    }
}
```

### 添加缓存
```java
@Cacheable("fujianCities")
private List<String> getFujianCities() {
    return regionRepository.findByProvince(PROVINCE).stream()
        .filter(r -> r.getCity() != null)
        .map(Region::getCity)
        .collect(Collectors.toList());
}
```

## 相关文件

- `src/main/java/com/example/voyagerdemo/service/FujianPoiCollectorService.java` - 修改的服务类
- `src/main/java/com/example/voyagerdemo/repository/RegionRepository.java` - Region数据访问
- `database/region_poi_tables.sql` - 数据库表结构

## 修改时间
2026-03-30

## 修改状态
✅ 已完成并测试
